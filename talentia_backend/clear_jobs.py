#!/usr/bin/env python3
"""Clear all jobs from the database."""

import asyncio
from app.db import get_collection

async def clear_jobs():
    """Delete all jobs from the collection."""
    col = get_collection('jobs')
    result = await col.delete_many({})
    print(f'✓ Deleted {result.deleted_count} jobs from database')

if __name__ == '__main__':
    asyncio.run(clear_jobs())

