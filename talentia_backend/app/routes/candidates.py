from fastapi import APIRouter, UploadFile, File, HTTPException
from app.db import get_collection
import os
from tempfile import NamedTemporaryFile
from app.utils.text_extraction import extract_text
from app.nlp.embeddings import embed_text
from datetime import datetime
from bson.objectid import ObjectId
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory recent upload events (dev/debug only)
RECENT_UPLOADS = []
RECENT_UPLOADS_MAX = 50


@router.post("/upload")
async def upload_cv(file: UploadFile = File(...)):
    """Upload and process a CV file"""
    logger.info(f"Received file upload: {file.filename}, content_type: {file.content_type}")
    
    # Validate file type
    allowed_extensions = ['.pdf', '.doc', '.docx']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Format de fichier non supporté. Utilisez: {', '.join(allowed_extensions)}"
        )
    
    # Save to temp file
    suffix = file_ext
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        try:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
        except Exception as e:
            logger.exception("Failed to save uploaded file")
            raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde: {str(e)}")

    # Capture some metadata and a safe snippet for debugging
    try:
        size = os.path.getsize(tmp_path)
    except Exception:
        size = len(contents) if 'contents' in locals() else None

    snippet = None
    try:
        # try to read a small portion and decode as text
        with open(tmp_path, 'rb') as f:
            sample = f.read(1600)
        try:
            snippet = sample.decode('utf-8', errors='ignore')
        except Exception:
            # fallback to repr of bytes
            snippet = str(sample[:200])
    except Exception as e:
        logger.debug(f"Could not read snippet for {file.filename}: {e}")

    try:
        # Extract text
        try:
            text = extract_text(tmp_path)
            logger.info(f"Extracted {len(text)} characters from {file.filename}")
        except Exception as e:
            logger.exception(f"Failed to extract text from {file.filename}")
            # record event for debugging
            event = {
                "filename": file.filename,
                "content_type": file.content_type,
                "size": size,
                "snippet": snippet,
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
            }
            RECENT_UPLOADS.insert(0, event)
            if len(RECENT_UPLOADS) > RECENT_UPLOADS_MAX:
                RECENT_UPLOADS.pop()
            raise HTTPException(
                status_code=400, 
                detail=f"Impossible d'extraire le texte du fichier. Vérifiez le format."
            )

        if not text or len(text.strip()) < 50:
            logger.warning(f"Insufficient text extracted from {file.filename}")
            # record event
            event = {
                "filename": file.filename,
                "content_type": file.content_type,
                "size": size,
                "snippet": snippet,
                "timestamp": datetime.utcnow().isoformat(),
                "text_length": len(text) if text else 0,
                "error": "Insufficient text extracted",
            }
            RECENT_UPLOADS.insert(0, event)
            if len(RECENT_UPLOADS) > RECENT_UPLOADS_MAX:
                RECENT_UPLOADS.pop()
            raise HTTPException(
                status_code=400, 
                detail="Le fichier semble vide ou trop court. Assurez-vous qu'il contient du texte."
            )

        # Generate embedding
        emb = None
        emb_error = None
        try:
            emb = embed_text(text)
            logger.info(f"Generated embedding for {file.filename}")
        except RuntimeError as re:
            logger.warning(f"Embedding generation unavailable: {re}")
            emb_error = str(re)
        except Exception as e:
            logger.exception(f"Unexpected error during embedding: {e}")
            emb_error = str(e)

        # Store in database
        candidates = get_collection("candidates")
        doc = {
            "full_text": text,
            "embedding": emb,
            "filename": file.filename,
            "created_at": datetime.utcnow(),
        }
        res = await candidates.insert_one(doc)
        
        candidate_id = str(res.inserted_id)
        logger.info(f"Candidate created id={candidate_id}")

        # record successful event
        event = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": size,
            "snippet": snippet,
            "timestamp": datetime.utcnow().isoformat(),
            "text_length": len(text),
            "has_embedding": emb is not None,
            "embedding_error": emb_error,
            "candidate_id": candidate_id,
        }
        RECENT_UPLOADS.insert(0, event)
        if len(RECENT_UPLOADS) > RECENT_UPLOADS_MAX:
            RECENT_UPLOADS.pop()

        return {
            "id": candidate_id,
            "message": "CV téléchargé et analysé avec succès",
            "text_length": len(text),
            "has_embedding": emb is not None,
            "embedding_error": emb_error,
        }
        
    finally:
        # Cleanup temp file
        try:
            os.unlink(tmp_path)
        except Exception as e:
            logger.warning(f"Failed to delete temp file: {e}")


@router.get('/admin/uploads/recent')
async def get_recent_uploads():
    """Return recent upload events (dev/debug). Not for production."""
    # return a shallow copy to avoid accidental mutation
    return RECENT_UPLOADS[:]