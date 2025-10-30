from pdfminer.high_level import extract_text as extract_text_from_pdf
import docx
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def extract_text_from_docx(path: str) -> str:
    """Extract text from a DOCX file"""
    try:
        doc = docx.Document(path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text)
        return "\n".join(full_text)
    except Exception as e:
        logger.error(f"Failed to extract from DOCX: {e}")
        raise ValueError(f"Erreur lors de la lecture du fichier DOCX: {str(e)}")


def extract_text(path: str, content_type: Optional[str] = None) -> str:
    """Extract text from PDF or DOCX file"""
    ext = path.lower()
    
    try:
        if ext.endswith('.pdf'):
            text = extract_text_from_pdf(path)
        elif ext.endswith('.docx') or ext.endswith('.doc'):
            text = extract_text_from_docx(path)
        else:
            # Try PDF as fallback
            try:
                text = extract_text_from_pdf(path)
            except Exception:
                raise ValueError("Format de fichier non reconnu")
        
        if not text or not text.strip():
            # If PDF contained no selectable text, try OCR fallback (if available)
            logger.info("No selectable text found, attempting OCR fallback")
            ocr_text = None
            try:
                # lazy imports for optional heavy deps
                from pdf2image import convert_from_path
                import pytesseract
                from PIL import Image

                # convert first few pages to images and OCR them
                pages = convert_from_path(path, dpi=200, first_page=1, last_page=5)
                parts = []
                for p in pages:
                    try:
                        txt = pytesseract.image_to_string(p)
                        if txt and txt.strip():
                            parts.append(txt)
                    except Exception as e:
                        logger.debug(f"OCR page failed: {e}")
                ocr_text = "\n".join(parts).strip()
            except Exception as e:
                logger.info(f"OCR fallback unavailable or failed: {e}")

            if ocr_text and ocr_text.strip():
                text = ocr_text
            else:
                raise ValueError("Aucun texte extrait du fichier")
        
        # final check
        if not text or not text.strip():
            raise ValueError("Aucun texte extrait du fichier")
        
        return text.strip()
        
    except ValueError:
        raise
    except Exception as e:
        logger.exception(f"Text extraction failed: {e}")
        raise ValueError(f"Erreur lors de l'extraction du texte: {str(e)}")