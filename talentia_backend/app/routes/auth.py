# app/api/auth.py
from fastapi import APIRouter, HTTPException, status, Header, BackgroundTasks
from app.db import get_collection
from app.schemas import UserCreate
from passlib.hash import bcrypt
import jwt
from datetime import datetime, timedelta
from app.core.config import settings
from bson.objectid import ObjectId
import logging
from scrapers import api_scraper

router = APIRouter()
logger = logging.getLogger(__name__)

# Helper to create JWT token
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Background scraping task: fetch multiple job categories dynamically
async def _auto_scrape_on_login():
    try:
        logger.info("Starting automatic job scraping")

        # List of job queries/categories
        job_queries = [
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

        # Call scraper using 'query_list' instead of 'query'
        all_jobs = api_scraper.scrape_jobs_with_api(query_list=job_queries, location='Morocco', limit=20)

        if not all_jobs:
            logger.warning("No jobs scraped")
            return

        jobs_col = get_collection('jobs')

        # Remove '_id' if exists to avoid insertion conflicts
        for j in all_jobs:
            j.pop('_id', None)

        res = await jobs_col.insert_many(all_jobs)
        logger.info(f"Inserted {len(res.inserted_ids)} jobs for multiple queries")

    except Exception as e:
        logger.error(f"Error during scraping: {str(e)}", exc_info=True)

# Register endpoint
@router.post("/register")
async def register(item: UserCreate, background_tasks: BackgroundTasks):
    users = get_collection("users")
    exists = await users.find_one({"email": item.email})
    if exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed = bcrypt.hash(item.password)
    doc = {"email": item.email, "password": hashed, "full_name": item.full_name}
    res = await users.insert_one(doc)
    access_token = create_access_token({"sub": str(res.inserted_id)})

    background_tasks.add_task(_auto_scrape_on_login)
    return {"access_token": access_token, "token_type": "bearer", "user_id": str(res.inserted_id)}

# Login endpoint
@router.post("/login")
async def login(item: UserCreate, background_tasks: BackgroundTasks):
    users = get_collection("users")
    u = await users.find_one({"email": item.email})
    if not u or not bcrypt.verify(item.password, u.get("password", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(u["_id"])})

    background_tasks.add_task(_auto_scrape_on_login)
    return {"access_token": access_token, "token_type": "bearer", "user_id": str(u["_id"])}

# Helper: extract token from header
def _get_token_from_header(authorization: str | None):
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]

# Get current user
@router.get("/me")
async def me(authorization: str | None = Header(None)):
    token = _get_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        users = get_collection("users")
        u = await users.find_one({"_id": ObjectId(sub)})
        if not u:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return {"id": str(u["_id"]), "email": u.get("email"), "full_name": u.get("full_name")}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
