import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from app.nlp.embeddings import embed_text
from app.db import get_collection
from datetime import datetime, timedelta
import logging
import time
import re

logger = logging.getLogger(__name__)

# Mock data for testing when scraping fails
MOCK_JOBS = [
    {
        'title': 'Senior Data Scientist',
        'company': 'TechCorp Solutions',
        'description': 'We are looking for an experienced Data Scientist to join our team. You will work on machine learning projects and data analysis.',
        'url': 'https://www.indeed.com/jobs?q=data+scientist&l=',
        'location': 'Casablanca',
        'type': 'CDI',
        'salary': '45,000 - 65,000 MAD',
        'experience': '3-5 ans',
        'posted_date': datetime.utcnow() - timedelta(days=2),
    },
    {
        'title': 'Machine Learning Engineer',
        'company': 'AI Innovations Inc',
        'description': 'Join our ML team to build cutting-edge AI solutions. Experience with Python, TensorFlow, and cloud platforms required.',
        'url': 'https://www.indeed.com/jobs?q=machine+learning+engineer&l=',
        'location': 'Rabat',
        'type': 'CDI',
        'salary': '50,000 - 70,000 MAD',
        'experience': '2-4 ans',
        'posted_date': datetime.utcnow() - timedelta(days=5),
    },
]


def scrape_linkedin_jobs(query: str, location: str = "", days: int = 15, limit: int = 50):
    """
    Scrape jobs from LinkedIn posted in the last N days using Selenium with better detection.

    Args:
        query: Job search query
        location: Location filter
        days: Number of days to look back (default 15)
        limit: Maximum number of jobs to scrape
    """
    jobs = []

    try:
        # Setup Chrome options with better anti-detection
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')  # New headless mode
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        driver = webdriver.Chrome(options=chrome_options)

        # Inject JavaScript to hide automation
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false,
                });
            '''
        })

        # Build LinkedIn jobs URL with date filter
        base_url = "https://www.linkedin.com/jobs/search/"
        params = {
            'keywords': query,
            'location': location,
            'f_TPR': f'r{days*86400}',  # Time posted recently (in seconds)
            'position': 1,
            'pageNum': 0
        }

        url = base_url + '?' + '&'.join([f'{k}={requests.utils.quote(str(v))}' for k, v in params.items()])

        logger.info(f"Scraping LinkedIn: {url}")
        driver.get(url)

        # Wait longer for page to fully load
        time.sleep(5)

        # Scroll to load more jobs
        for _ in range(5):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)

        # Find all job cards - try multiple selectors
        job_cards = []
        selectors = [
            '.job-search-card',
            '[data-job-id]',
            '.base-card',
            'li[data-job-id]'
        ]

        for selector in selectors:
            try:
                job_cards = driver.find_elements(By.CSS_SELECTOR, selector)
                if job_cards:
                    logger.info(f"Found {len(job_cards)} job cards using selector: {selector}")
                    break
            except:
                continue

        if not job_cards:
            logger.warning("No job cards found on LinkedIn page")
            driver.quit()
            return []

        for idx, card in enumerate(job_cards[:limit]):
            try:
                # Initialize all fields
                title = ""
                company = ""
                job_location = ""
                job_url = ""
                posted_date = datetime.utcnow()
                description = ""
                salary = None
                experience = None
                job_type = 'CDI'

                # Extract title - try multiple selectors
                title_selectors = [
                    '.base-search-card__title',
                    'h3',
                    '[data-test-id="job-card-title"]',
                    '.job-card-title'
                ]
                for selector in title_selectors:
                    try:
                        title_elem = card.find_element(By.CSS_SELECTOR, selector)
                        title = title_elem.text.strip()
                        if title:
                            break
                    except:
                        continue

                # Extract company - try multiple selectors
                company_selectors = [
                    '.base-search-card__subtitle',
                    '.base-search-card__subtitle a',
                    '[data-test-id="job-card-company-name"]',
                    '.job-card-company'
                ]
                for selector in company_selectors:
                    try:
                        company_elem = card.find_element(By.CSS_SELECTOR, selector)
                        company = company_elem.text.strip()
                        if company:
                            break
                    except:
                        continue

                # Extract location - try multiple selectors
                location_selectors = [
                    '.job-search-card__location',
                    '.job-search-card__location span',
                    '[data-test-id="job-card-location"]',
                    '.job-card-location'
                ]
                for selector in location_selectors:
                    try:
                        location_elem = card.find_element(By.CSS_SELECTOR, selector)
                        job_location = location_elem.text.strip()
                        if job_location:
                            break
                    except:
                        continue

                # Extract job URL - try multiple selectors
                url_selectors = [
                    'a.base-card__full-link',
                    'a[href*="/jobs/view/"]',
                    '[data-job-id]',
                    'a[href*="linkedin.com/jobs"]'
                ]
                for selector in url_selectors:
                    try:
                        link_elem = card.find_element(By.CSS_SELECTOR, selector)
                        job_url = link_elem.get_attribute('href')
                        if job_url:
                            break
                    except:
                        continue

                # Extract posted date - try multiple selectors
                date_selectors = [
                    '.job-search-card__listdate',
                    'time',
                    '[data-test-id="job-card-posted-date"]'
                ]
                for selector in date_selectors:
                    try:
                        date_elem = card.find_element(By.CSS_SELECTOR, selector)
                        posted_text = date_elem.get_attribute('datetime')
                        if posted_text:
                            posted_date = datetime.fromisoformat(posted_text.replace('Z', '+00:00'))
                            break
                    except:
                        continue

                # Click on job to get full description
                try:
                    if job_url:
                        # Navigate directly to job URL instead of clicking
                        driver.get(job_url)
                        time.sleep(4)  # Wait for page to load
                    else:
                        # Try clicking on card
                        try:
                            card.click()
                            time.sleep(4)
                        except:
                            pass

                    # Try multiple selectors for description
                    description_selectors = [
                        '.show-more-less-html__markup',
                        '.show-more-less-html',
                        '.description__text',
                        '[data-test-id="job-details-jobs-unified-top-card__job-description"]',
                        '.jobs-details__main-content',
                        '.jobs-details-top-card__job-description',
                        '.description'
                    ]

                    for selector in description_selectors:
                        try:
                            desc_elem = driver.find_element(By.CSS_SELECTOR, selector)
                            description = desc_elem.text.strip()
                            if description and len(description) > 10:
                                logger.info(f"Found description with selector: {selector}")
                                break
                        except:
                            continue

                    # If still no description, try to get all text from job details
                    if not description or len(description) < 10:
                        try:
                            job_details = driver.find_element(By.CSS_SELECTOR, '.jobs-details__main-content')
                            description = job_details.text.strip()
                            if description:
                                logger.info("Got description from main content")
                        except:
                            pass

                    # Extract salary, experience, type from job insights
                    try:
                        criteria_selectors = [
                            '.job-details-jobs-unified-top-card__job-insight',
                            '[data-test-id="job-details-jobs-unified-top-card__job-insight"]',
                            '.description__job-criteria-item',
                            '.job-insight',
                            '[data-test-id*="job-insight"]'
                        ]

                        criteria = []
                        for selector in criteria_selectors:
                            try:
                                criteria = driver.find_elements(By.CSS_SELECTOR, selector)
                                if criteria:
                                    logger.info(f"Found {len(criteria)} criteria with selector: {selector}")
                                    break
                            except:
                                continue

                        for criterion in criteria:
                            try:
                                text = criterion.text.strip()
                                if not text:
                                    continue

                                logger.info(f"Criterion text: {text}")

                                # Extract salary
                                if ('MAD' in text or 'DH' in text or '$' in text or '€' in text) and not salary:
                                    salary = text
                                    logger.info(f"Found salary: {salary}")

                                # Extract experience
                                if ('an' in text.lower() or 'year' in text.lower() or 'ans' in text.lower()) and not experience:
                                    experience = text
                                    logger.info(f"Found experience: {experience}")

                                # Extract job type
                                if ('CDD' in text or 'CDI' in text or 'Stage' in text or 'Freelance' in text) and job_type == 'CDI':
                                    job_type = text
                                    logger.info(f"Found job type: {job_type}")
                            except Exception as e:
                                logger.warning(f"Error processing criterion: {e}")
                                continue

                    except Exception as e:
                        logger.warning(f"Could not extract criteria: {e}")

                    # If description is still empty, use title as fallback
                    if not description or len(description) < 5:
                        description = f"{title} - {company}" if title and company else (title or company or "Job description not available")

                except Exception as e:
                    logger.warning(f"Could not get full job details: {e}")
                    description = f"{title} - {company}" if title and company else (title or company or "Job description not available")
                
                # Create embedding
                text = f"{title}\n{company}\n{description}"
                embedding = embed_text(text)
                
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
                    'source': 'linkedin'
                })
                
                logger.info(f"Scraped LinkedIn job: {title} at {company}")
                
            except Exception as e:
                logger.warning(f"Error scraping job card: {e}")
                continue
        
        driver.quit()
        logger.info(f"Successfully scraped {len(jobs)} jobs from LinkedIn")
        
    except Exception as e:
        logger.error(f"LinkedIn scraping failed: {e}")
        logger.info("Falling back to mock data")
        jobs = []
    
    return jobs


def scrape_indeed_jobs(q: str, location: str = "", limit: int = 20, minimal: bool = False):
    """
    Scrape jobs from Indeed.

    Args:
        q: Search query
        location: Location filter
        limit: Max jobs to scrape
        minimal: If True, only scrape URL and type (faster). If False, scrape full details.
    """
    try:
        url = f"https://www.indeed.com/jobs?q={requests.utils.quote(q)}&l={requests.utils.quote(location)}"

        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ]

        headers = {
            "User-Agent": user_agents[0],
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        cards = soup.select('.jobsearch-SerpJobCard')[:limit]

        if not cards:
            logger.warning(f"No job cards found on Indeed")
            raise Exception("No job listings found")

        jobs = []
        for c in cards:
            title_el = c.select_one('h2.title')
            company_el = c.select_one('span.company')
            summary_el = c.select_one('div.summary')
            location_el = c.select_one('div.recJobLoc, span.location')

            link_el = title_el.select_one('a') if title_el else None
            link = 'https://www.indeed.com' + link_el.get('href') if link_el and link_el.get('href') else None

            if not link:
                continue

            # MINIMAL MODE: Only extract URL and type
            if minimal:
                summary = summary_el.get_text(strip=True) if summary_el else ''

                # Extract job type from summary
                job_type = 'CDI'
                if 'CDD' in summary or 'contract' in summary.lower():
                    job_type = 'CDD'
                elif 'stage' in summary.lower() or 'intern' in summary.lower():
                    job_type = 'Stage'
                elif 'freelance' in summary.lower():
                    job_type = 'Freelance'

                jobs.append({
                    'url': link,
                    'type': job_type,
                    'scraped_at': datetime.utcnow(),
                    'source': 'indeed'
                })
            else:
                # FULL MODE: Extract all details
                title = title_el.get_text(strip=True) if title_el else ''
                company = company_el.get_text(strip=True) if company_el else ''
                summary = summary_el.get_text(strip=True) if summary_el else ''
                job_location = location_el.get_text(strip=True) if location_el else location
                salary_el = c.select_one('span.salaryText')
                salary = salary_el.get_text(strip=True) if salary_el else None

                if not title or not company:
                    continue

                # Try to extract job type and experience from description
                job_type = 'CDI'
                experience = None

                if 'CDD' in summary or 'contract' in summary.lower():
                    job_type = 'CDD'
                elif 'stage' in summary.lower() or 'intern' in summary.lower():
                    job_type = 'Stage'
                elif 'freelance' in summary.lower():
                    job_type = 'Freelance'

                # Extract experience requirement
                exp_match = re.search(r'(\d+)\+?\s*(?:ans?|years?)', summary, re.IGNORECASE)
                if exp_match:
                    experience = f"{exp_match.group(1)}+ ans"

                text = f"{title}\n{company}\n{summary}"
                emb = embed_text(text)
                jobs.append({
                    'title': title,
                    'company': company,
                    'description': summary,
                    'url': link,
                    'location': job_location,
                    'type': job_type,
                    'salary': salary,
                    'experience': experience,
                    'embedding': emb,
                    'scraped_at': datetime.utcnow(),
                    'posted_date': datetime.utcnow(),
                    'source': 'indeed'
                })

        if jobs:
            logger.info(f"Successfully scraped {len(jobs)} jobs from Indeed (minimal={minimal})")
            return jobs
        else:
            raise Exception("No valid jobs extracted")

    except Exception as e:
        logger.warning(f"Indeed scraping failed: {str(e)}")
        return []


def scrape_all_sources(query: str, location: str = "", days: int = 15, limit: int = 50):
    """
    Scrape jobs from LinkedIn only, posted in the last N days with ALL details.

    Args:
        query: Job search query
        location: Location filter
        days: Number of days to look back (default 15)
        limit: Maximum number of jobs to scrape
    """
    all_jobs = []

    # Scrape LinkedIn ONLY - with all details
    logger.info(f"Starting LinkedIn scraping for '{query}' in {location} (last {days} days)...")
    linkedin_jobs = scrape_linkedin_jobs(query, location, days, limit)
    all_jobs.extend(linkedin_jobs)

    # If LinkedIn failed, use mock data
    if not all_jobs:
        logger.warning("LinkedIn scraping failed. Using mock data.")
        for job_data in MOCK_JOBS[:limit]:
            # Full mock data with all details
            text = f"{job_data['title']}\n{job_data['company']}\n{job_data['description']}"
            emb = embed_text(text)
            job_data['embedding'] = emb
            job_data['scraped_at'] = datetime.utcnow()
            job_data['source'] = 'mock'
            all_jobs.append(job_data)

    logger.info(f"Total jobs scraped from LinkedIn: {len(all_jobs)}")
    return all_jobs


def ingest_to_mongo(jobs):
    """Save jobs to MongoDB, avoiding duplicates."""
    col = get_collection('jobs')
    inserted = 0
    
    for j in jobs:
        # Check if job already exists (by URL or title+company)
        existing = col.find_one({
            '$or': [
                {'url': j.get('url')},
                {'title': j['title'], 'company': j['company']}
            ]
        })
        
        if not existing:
            col.insert_one(j)
            inserted += 1
        else:
            logger.debug(f"Job already exists: {j['title']} at {j['company']}")
    
    logger.info(f"Inserted {inserted} new jobs into database")
    return inserted


if __name__ == '__main__':
    # Example: Scrape jobs from last 15 days
    items = scrape_all_sources('data scientist', 'Morocco', days=15, limit=30)
    print(f'Scraped {len(items)} jobs')
    
    # Save to database
    ingest_to_mongo(items)