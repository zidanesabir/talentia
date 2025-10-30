from fastapi import APIRouter, HTTPException, Header
from app.core.config import settings
from app.db import get_collection
import logging
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)


def _check_admin_key(x_admin_key: Optional[str]):
    # Simple dev-only protection: require X-ADMIN-KEY header to equal SECRET_KEY
    if not x_admin_key or x_admin_key != settings.SECRET_KEY:
        return False
    return True


@router.post('/candidates/reembed')
async def reembed_candidates(limit: int = 100, batch_size: int = 10, x_admin_key: Optional[str] = Header(None)):
    """Recompute embeddings for candidates missing them.

    Dev-only: requires header X-ADMIN-KEY == SECRET_KEY. This function will attempt to lazily
    load sentence-transformers; if the package is not installed it returns an error explaining the issue.
    """
    if not _check_admin_key(x_admin_key):
        raise HTTPException(status_code=401, detail='Missing or invalid admin key')

    candidates = get_collection('candidates')

    # Try to import the embedding function lazily
    try:
        from app.nlp.embeddings import embed_text
    except Exception as e:
        logger.exception('Embedding module unavailable')
        raise HTTPException(status_code=500, detail=f'Embedding unavailable: {e}')

    updated = 0
    errors = []

    cursor = candidates.find({'$or': [{'embedding': {'$exists': False}}, {'embedding': None}]}, limit=limit)
    async for doc in cursor:
        cid = doc.get('_id')
        text = doc.get('full_text') or ''
        if not text or len(text.strip()) < 20:
            errors.append({'id': str(cid), 'error': 'no or too short text'})
            continue
        try:
            emb = embed_text(text)
            await candidates.update_one({'_id': cid}, {'$set': {'embedding': emb}})
            updated += 1
        except Exception as e:
            logger.exception(f'Failed to embed candidate {cid}: {e}')
            errors.append({'id': str(cid), 'error': str(e)})

    return {'updated': updated, 'errors': errors}
