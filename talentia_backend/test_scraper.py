#!/usr/bin/env python
"""Test script to verify scraper and database integration."""

import asyncio
import sys
from scrapers.indeed_scraper import scrape
from app.db import get_collection

async def test_scraper():
    """Test the scraper and database insertion."""
    print("Testing scraper...")
    
    # Test scraping
    jobs = scrape('data scientist', '', 5)
    print(f"✓ Scraped {len(jobs)} jobs")
    
    if not jobs:
        print("✗ No jobs scraped!")
        return False
    
    print(f"✓ First job: {jobs[0]['title']} at {jobs[0]['company']}")
    
    # Test database insertion
    print("\nTesting database insertion...")
    try:
        jobs_col = get_collection('jobs')
        
        # Remove _id fields
        for j in jobs:
            if '_id' in j:
                del j['_id']
        
        # Insert jobs
        result = await jobs_col.insert_many(jobs)
        print(f"✓ Inserted {len(result.inserted_ids)} jobs into database")
        
        # Verify insertion
        count = await jobs_col.count_documents({})
        print(f"✓ Total jobs in database: {count}")
        
        # Fetch and display
        cursor = jobs_col.find({}).limit(1)
        async for job in cursor:
            print(f"✓ Sample job from DB: {job['title']} at {job['company']}")
        
        return True
    except Exception as e:
        print(f"✗ Database error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = asyncio.run(test_scraper())
    sys.exit(0 if success else 1)

