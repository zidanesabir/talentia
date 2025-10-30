from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.db import get_collection
from app.nlp.embeddings import cosine_sim
from bson.objectid import ObjectId
import logging
from typing import Optional

# Fixed import path
from scrapers import api_scraper

router = APIRouter()
logger = logging.getLogger(__name__)


async def _background_scrape(query: str, location: str, limit: int):
    """Background task to scrape jobs"""
    try:
        logger.info(f"Starting background scrape: query={query}, location={location}")
        jobs = api_scraper.scrape_jobs_with_api(query, location, limit)

        if not jobs:
            logger.warning("No jobs scraped")
            return

        # Insert jobs into database
        jobs_col = get_collection('jobs')
        for j in jobs:
            if '_id' in j:
                del j['_id']

        res = await jobs_col.insert_many(jobs)
        logger.info(f"Background scrape complete: {len(res.inserted_ids)} jobs inserted")
    except Exception as e:
        logger.error(f"Background scraping failed: {e}", exc_info=True)


@router.post('/scrape')
async def trigger_scrape(
    background_tasks: BackgroundTasks,
    query: str = Query(..., description="Job search query"),
    location: str = Query("", description="Location filter"),
    limit: int = Query(30, description="Max jobs to scrape")
):
    """Trigger job scraping in background"""
    background_tasks.add_task(_background_scrape, query, location, limit)
    return {
        "status": "scraping_started",
        "message": f"Scraping jobs for '{query}' in background"
    }


@router.get('/all')
async def get_all_jobs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    q: str = Query(None, description="Search query"),
    location: str = Query(None, description="Location filter"),
    contract: str = Query(None, description="Contract type filter (CDI, CDD, Stage, etc.)")
):
    """Get all jobs with pagination and optional filters"""
    jobs_col = get_collection('jobs')

    # Build filter
    filter_query = {}
    if location:
        filter_query['location'] = {'$regex': location, '$options': 'i'}
    if contract:
        filter_query['type'] = {'$regex': contract, '$options': 'i'}

    # If there's a text query, search in title, description, company
    if q:
        filter_query['$or'] = [
            {'title': {'$regex': q, '$options': 'i'}},
            {'description': {'$regex': q, '$options': 'i'}},
            {'company': {'$regex': q, '$options': 'i'}}
        ]

    # Get total count
    total = await jobs_col.count_documents(filter_query)

    # Calculate skip
    skip = (page - 1) * page_size

    # Get paginated results
    cursor = jobs_col.find(filter_query).skip(skip).limit(page_size)
    jobs = []
    async for doc in cursor:
        jobs.append({
            'id': str(doc['_id']),
            'title': doc.get('title'),
            'company': doc.get('company'),
            'location': doc.get('location'),
            'description': doc.get('description'),
            'url': doc.get('url'),
            'type': doc.get('type'),
            'salary': doc.get('salary'),
            'experience': doc.get('experience'),
            'scraped_at': doc.get('scraped_at'),
            'posted_date': doc.get('posted_date'),
            'source': doc.get('source')
        })

    return {
        'jobs': jobs,
        'count': len(jobs),
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size
    }


@router.get('/search')
async def search_jobs(
    query: str = Query(None, description="Search query"),
    location: str = Query(None, description="Location filter"),
    job_type: str = Query(None, description="Job type filter (CDI, CDD, Stage, etc.)"),
    limit: int = Query(20, ge=1, le=100)
):
    """Search jobs with filters"""
    jobs_col = get_collection('jobs')

    # Build filter
    filter_query = {}
    if location:
        filter_query['location'] = {'$regex': location, '$options': 'i'}
    if job_type:
        filter_query['type'] = job_type

    # If there's a text query, we could do a simple text search
    if query:
        filter_query['$or'] = [
            {'title': {'$regex': query, '$options': 'i'}},
            {'description': {'$regex': query, '$options': 'i'}},
            {'company': {'$regex': query, '$options': 'i'}}
        ]

    cursor = jobs_col.find(filter_query).limit(limit)
    jobs = []
    async for doc in cursor:
        jobs.append({
            'id': str(doc['_id']),
            'title': doc.get('title'),
            'company': doc.get('company'),
            'location': doc.get('location'),
            'description': doc.get('description'),
            'url': doc.get('url'),
            'type': doc.get('type'),
            'salary': doc.get('salary'),
            'experience': doc.get('experience'),
            'scraped_at': doc.get('scraped_at'),
            'posted_date': doc.get('posted_date'),
            'source': doc.get('source')
        })

    return {'jobs': jobs, 'count': len(jobs)}


@router.get('/match/{candidate_id}')
async def match_jobs(
    candidate_id: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Find matching jobs for a candidate based on embedding similarity"""
    candidates_col = get_collection('candidates')
    jobs_col = get_collection('jobs')
    
    # Get candidate
    try:
        candidate = await candidates_col.find_one({'_id': ObjectId(candidate_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid candidate ID")
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    candidate_emb = candidate.get('embedding')
    if not candidate_emb:
        raise HTTPException(
            status_code=400, 
            detail="Candidate has no embedding. Please re-upload CV."
        )
    
    # Get all jobs with embeddings
    cursor = jobs_col.find({'embedding': {'$exists': True, '$ne': None}})
    matches = []
    
    async for job in cursor:
        job_emb = job.get('embedding')
        if job_emb:
            similarity = cosine_sim(candidate_emb, job_emb)
            matches.append({
                'id': str(job['_id']),
                'title': job.get('title'),
                'company': job.get('company'),
                'location': job.get('location'),
                'description': job.get('description'),
                'url': job.get('url'),
                'type': job.get('type'),
                'salary': job.get('salary'),
                'experience': job.get('experience'),
                'similarity': similarity,
                'scraped_at': job.get('scraped_at'),
                'posted_date': job.get('posted_date'),
                'source': job.get('source')
            })
    
    # Sort by similarity
    matches.sort(key=lambda x: x['similarity'], reverse=True)
    
    return {
        'candidate_id': candidate_id,
        'matches': matches[:limit],
        'total_matches': len(matches)
    }


@router.get('/{job_id}')
async def get_job(job_id: str):
    """Get a single job by ID"""
    jobs_col = get_collection('jobs')
    
    try:
        job = await jobs_col.find_one({'_id': ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        'id': str(job['_id']),
        'title': job.get('title'),
        'company': job.get('company'),
        'location': job.get('location'),
        'description': job.get('description'),
        'url': job.get('url'),
        'type': job.get('type'),
        'salary': job.get('salary'),
        'experience': job.get('experience'),
        'scraped_at': job.get('scraped_at'),
        'posted_date': job.get('posted_date'),
        'source': job.get('source')
    }