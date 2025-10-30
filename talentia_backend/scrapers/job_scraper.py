import requests
import logging
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import re

load_dotenv()
from app.nlp.embeddings import embed_text

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

MOCK_JOBS = [
    {
        'title': 'Senior Data Scientist',
        'company': 'TechCorp Morocco',
        'description': 'We are seeking an experienced Data Scientist with Python, Machine Learning, and SQL skills.',
        'url': 'https://example.com/job1',
        'location': 'Casablanca, Morocco',
        'type': 'CDI',
        'salary': '45,000 - 65,000 MAD/month',
        'experience': '3-5 ans',
        'posted_date': datetime.utcnow() - timedelta(days=2),
    },
]

def map_employment_type(api_type: str):
    """Map API job type to internal type."""
    api_type = (api_type or "").upper()
    mapping = {
        "FULLTIME": "CDI",
        "CONTRACTOR": "CDD",
        "CONTRACT": "CDD",
        "INTERN": "Stage",
        "PARTTIME": "Part-time",
        "TEMPORARY": "Temporaire",
        "FREELANCE": "Freelance",
    }
    return mapping.get(api_type, "Unknown")

def extract_skills_from_text(text: str) -> list:
    """Extract common tech skills from job description."""
    skill_patterns = [
        r'\bPython\b', r'\bJava\b', r'\bJavaScript\b', r'\bTypeScript\b',
        r'\bReact\b', r'\bAngular\b', r'\bVue\.js\b', r'\bNode\.js\b',
        r'\bSQL\b', r'\bMongoDB\b', r'\bPostgreSQL\b', r'\bMySQL\b',
        r'\bAWS\b', r'\bAzure\b', r'\bGCP\b', r'\bDocker\b', r'\bKubernetes\b',
        r'\bGit\b', r'\bCI/CD\b', r'\bAgile\b', r'\bScrum\b',
        r'\bMachine Learning\b', r'\bAI\b', r'\bData Science\b',
        r'\bFastAPI\b', r'\bDjango\b', r'\bFlask\b', r'\bSpring\b'
    ]
    
    skills = []
    for pattern in skill_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                skills.append(match.group(0))
    
    return list(set(skills))

def scrape_jsearch_api(keyword: str, location: str, limit: int = 10):
    """Scrape jobs using JSearch API with comprehensive data extraction."""
    api_key = os.getenv('RAPIDAPI_KEY')
    if not api_key:
        logger.warning("No RAPIDAPI_KEY found in .env")
        return None

    try:
        logger.info(f"Fetching jobs from JSearch API: {keyword} in {location}")
        url = "https://jsearch.p.rapidapi.com/search"
        querystring = {
            "query": f"{keyword} in {location}",
            "page": "1",
            "num_pages": "1",
            "date_posted": "month"
        }
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }

        response = requests.get(url, headers=headers, params=querystring, timeout=15)
        if response.status_code != 200:
            logger.warning(f"JSearch API returned status {response.status_code}")
            return None

        data = response.json()
        jobs = []

        for job_data in data.get('data', [])[:limit]:
            title = job_data.get('job_title', 'Unknown Position')
            company = job_data.get('employer_name', 'Unknown Company')
            description = job_data.get('job_description', '')
            job_url = job_data.get('job_apply_link') or job_data.get('job_google_link', '')
            
            city = job_data.get('job_city', '')
            country = job_data.get('job_country', '')
            job_location = f"{city}, {country}" if city else country
            
            employment_type = job_data.get('job_employment_type', '')
            job_type = map_employment_type(employment_type)
            
            is_remote = job_data.get('job_is_remote', False)
            if is_remote:
                job_location += " (Remote)"
            
            salary = None
            if job_data.get('job_min_salary') and job_data.get('job_max_salary'):
                currency = job_data.get('job_salary_currency', 'MAD')
                period = job_data.get('job_salary_period', 'MONTH')
                min_sal = job_data['job_min_salary']
                max_sal = job_data['job_max_salary']
                salary = f"{min_sal:,.0f} - {max_sal:,.0f} {currency}/{period}"
            
            experience = None
            exp_data = job_data.get('job_required_experience', {})
            if exp_data:
                req_exp = exp_data.get('required_experience_in_months')
                if req_exp:
                    years = req_exp / 12
                    experience = f"{years:.0f}+ ans" if years >= 1 else "< 1 an"
            
            required_skills = job_data.get('job_required_skills', []) or []
            extracted_skills = extract_skills_from_text(description + ' ' + title)
            all_skills = list(set(required_skills + extracted_skills))
            
            highlights = job_data.get('job_highlights', {})
            qualifications = highlights.get('Qualifications', [])
            responsibilities = highlights.get('Responsibilities', [])
            benefits = highlights.get('Benefits', [])
            
            job_publisher = job_data.get('job_publisher', 'Unknown')
            employer_logo = job_data.get('employer_logo', None)
            
            posted_timestamp = job_data.get('job_posted_at_timestamp')
            posted_date = datetime.fromtimestamp(posted_timestamp) if posted_timestamp else datetime.utcnow()
            
            embedding_text = f"""
            Title: {title}
            Company: {company}
            Description: {description}
            Skills: {', '.join(all_skills)}
            Qualifications: {' '.join(qualifications)}
            """.strip()
            
            try:
                embedding = embed_text(embedding_text)
                has_embedding = True
            except Exception as e:
                logger.warning(f"Embedding failed for job {title}: {e}")
                embedding = None
                has_embedding = False
            
            job = {
                'title': title,
                'company': company,
                'description': description,
                'url': job_url,
                'location': job_location,
                'type': job_type,
                'salary': salary,
                'experience': experience,
                'skills': all_skills,
                'qualifications': qualifications,
                'responsibilities': responsibilities,
                'benefits': benefits,
                'is_remote': is_remote,
                'job_publisher': job_publisher,
                'employer_logo': employer_logo,
                'scraped_at': datetime.utcnow(),
                'posted_date': posted_date,
                'embedding': embedding,
                'has_embedding': has_embedding,
                'source': 'jsearch_api'
            }
            
            jobs.append(job)

        logger.info(f"Successfully fetched {len(jobs)} jobs from JSearch API")
        return jobs

    except Exception as e:
        logger.error(f"JSearch API scraping failed: {e}", exc_info=True)
        return None

def scrape_jobs_with_api(query_list=None, location="Morocco", limit=10, allow_mock=True):
    """Scrape multiple IT-related jobs using JSearch API."""
    if query_list is None:
        query_list = [
            "data scientist", "software engineer", "backend developer",
            "frontend developer", "full stack developer", "machine learning engineer",
            "devops engineer", "product manager"
        ]

    logger.info(f"Scraping jobs in {location}")
    all_jobs = []

    for q in query_list:
        jobs = scrape_jsearch_api(q, location, limit)
        if jobs:
            all_jobs.extend(jobs)

    seen_urls = set()
    unique_jobs = []
    for job in all_jobs:
        if job['url'] not in seen_urls:
            seen_urls.add(job['url'])
            unique_jobs.append(job)

    if not unique_jobs and allow_mock:
        logger.info("Using mock jobs as fallback")
        for job_data in MOCK_JOBS[:limit]:
            text = f"{job_data['title']}\n{job_data['company']}\n{job_data['description']}"
            try:
                embedding = embed_text(text)
            except:
                embedding = None
            unique_jobs.append({
                **job_data,
                'skills': extract_skills_from_text(job_data['description']),
                'embedding': embedding,
                'has_embedding': embedding is not None,
                'scraped_at': datetime.utcnow(),
                'source': 'mock'
            })

    return unique_jobs