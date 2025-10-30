# Talentia Backend

This repository contains a FastAPI backend for Talentia AI (no Docker).

Features included in this scaffold:
- JWT auth (register / login)
- CV upload (PDF/DOCX) and text extraction
- NLP embeddings using sentence-transformers
- Basic job scraper example (Indeed) and ingestion into MongoDB
- Matching endpoint: returns jobs ranked by compatibility score

Prerequisites
- Python 3.10+
- MongoDB instance (local or cloud) — connection string in `.env`

Quick start (PowerShell)

```powershell
cd c:\Users\hp\Desktop\talentia\talentia_backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env and set MONGODB_URI and SECRET_KEY
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Notes
- No Docker provided as requested.
- For production, use a process manager and secure environment variables.

Scraping guidance and legal note
- Always check robots.txt and terms of service of sites you scrape.
- Prefer official APIs when available.
- Use throttling, rotating proxies and respectful request rates.

See the `.env.example` and the `scrapers` folder for example scraper code.
.\.venv\Scripts\Activate.ps1; python -c "from scrapers.indeed_scraper import scrape; jobs = scrape('data scientist', '', 5); print(f'Scraped {len(jobs)} jobs'); print(jobs[0] if jobs else 'No jobs')"