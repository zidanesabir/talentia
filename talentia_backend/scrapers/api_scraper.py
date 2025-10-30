import requests
import logging
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from app.nlp.embeddings import embed_text

# Logger configuration
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Mock jobs as fallback
MOCK_JOBS = [
    {
        'title': 'Senior Data Scientist',
        'company': 'TechCorp Morocco',
        'description': 'We are seeking an experienced Data Scientist...',
        'url': 'https://www.linkedin.com/jobs/view/senior-data-scientist-morocco',
        'location': 'Casablanca, Morocco',
        'type': 'CDI',
        'salary': '45,000 - 65,000 MAD/month',
        'experience': '3-5 ans',
        'posted_date': datetime.utcnow() - timedelta(days=2),
    },
    {
        'title': 'Machine Learning Engineer',
        'company': 'AI Innovations Morocco',
        'description': 'Join our ML team to build cutting-edge AI solutions...',
        'url': 'https://www.linkedin.com/jobs/view/ml-engineer-morocco',
        'location': 'Rabat, Morocco',
        'type': 'CDI',
        'salary': '50,000 - 70,000 MAD/month',
        'experience': '2-4 ans',
        'posted_date': datetime.utcnow() - timedelta(days=5),
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

def scrape_jsearch_api(keyword: str, location: str, limit: int = 10):
    """Scrape jobs using JSearch API (RapidAPI)."""
    api_key = os.getenv('RAPIDAPI_KEY')
    if not api_key:
        logger.warning("No RAPIDAPI_KEY found in .env")
        return None

    try:
        logger.info(f"Fetching REAL jobs from JSearch API: {keyword} in {location}")
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

            # Correct employment type mapping
            employment_type = job_data.get('job_employment_type', '')
            job_type = map_employment_type(employment_type)

            # Salary
            salary = None
            if job_data.get('job_min_salary') and job_data.get('job_max_salary'):
                currency = job_data.get('job_salary_currency', 'MAD')
                period = job_data.get('job_salary_period', 'MONTH')
                salary = f"{job_data['job_min_salary']:,.0f} - {job_data['job_max_salary']:,.0f} {currency}/{period}"

            # Experience
            experience = None
            exp_data = job_data.get('job_required_experience', {})
            if exp_data:
                req_exp = exp_data.get('required_experience_in_months')
                if req_exp:
                    years = req_exp / 12
                    experience = f"{years:.0f}+ ans" if years >= 1 else "< 1 an"

            # Posted date
            posted_timestamp = job_data.get('job_posted_at_timestamp')
            posted_date = datetime.fromtimestamp(posted_timestamp) if posted_timestamp else datetime.utcnow()

            # Embedding
            text = f"{title}\n{company}\n{description}"
            try:
                embedding = embed_text(text)
            except Exception as e:
                logger.warning(f"Embedding failed for job {title}: {e}")
                embedding = None

            jobs.append({
                'title': title,
                'company': company,
                'description': description,
                'url': job_url,
                'location': job_location,
                'type': job_type,
                'salary': salary,
                'experience': experience,
                'embedding': embedding,
                'scraped_at': datetime.utcnow(),
                'posted_date': posted_date,
                'source': 'jsearch_api'
            })

        logger.info(f"Successfully fetched {len(jobs)} jobs from JSearch API")
        return jobs

    except Exception as e:
        logger.warning(f"JSearch API scraping failed: {e}")
        return None


def scrape_jobs_with_api(query_list=None, location="Morocco", limit=10, allow_mock=True):
    """Scrape multiple IT-related jobs using JSearch API, fallback to mock."""
    if query_list is None:
        query_list = [
            "data scientist",
            "software engineer",
            "backend developer",
            "frontend developer",
            "full stack developer",
            "machine learning engineer",
            "devops engineer",
            "product manager",
            "qa tester",
            "business analyst"
        ]

    logger.info(f"Scraping jobs in {location} with keywords: {query_list}")
    all_jobs = []

    for q in query_list:
        jobs = scrape_jsearch_api(q, location, limit)
        if jobs:
            all_jobs.extend(jobs)

    # Remove duplicates based on URL
    seen_urls = set()
    unique_jobs = []
    for job in all_jobs:
        if job['url'] not in seen_urls:
            seen_urls.add(job['url'])
            unique_jobs.append(job)

    # Fallback to mock jobs
    if not unique_jobs and allow_mock:
        logger.info("Using mock jobs as fallback")
        for job_data in MOCK_JOBS[:limit]:
            text = f"{job_data['title']}\n{job_data['company']}\n{job_data['description']}"
            try:
                embedding = embed_text(text)
            except Exception as e:
                logger.warning(f"Embedding failed: {e}")
                embedding = None
            unique_jobs.append({
                'title': job_data['title'],
                'company': job_data['company'],
                'description': job_data['description'],
                'url': job_data['url'],
                'location': job_data['location'],
                'type': job_data['type'],
                'salary': job_data.get('salary'),
                'experience': job_data.get('experience'),
                'embedding': embedding,
                'scraped_at': datetime.utcnow(),
                'posted_date': job_data['posted_date'],
                'source': 'mock'
            })

    return unique_jobs


if __name__ == "__main__":
    print("Testing IT job scraper...\n")
    jobs = scrape_jobs_with_api(limit=10, allow_mock=True)
    print(f'\nScraped {len(jobs)} IT-related jobs in Morocco\n')

    # Display first 5 jobs
    for i, job in enumerate(jobs[:5], 1):
        print(f"\n{'='*80}")
        print(f"Job {i}:")
        print(f"{'='*80}")
        print(f"Title: {job['title']}")
        print(f"Company: {job['company']}")
        print(f"Location: {job['location']}")
        print(f"Type: {job['type']}")
        print(f"Salary: {job.get('salary', 'N/A')}")
        print(f"Experience: {job.get('experience', 'N/A')}")
        print(f"URL: {job['url']}")
        print(f"Source: {job['source']}")
        print(f"Posted: {job['posted_date']}")
        print(f"\nDescription: {job['description'][:200]}...")
        print(f"Has embedding: {job['embedding'] is not None}")
