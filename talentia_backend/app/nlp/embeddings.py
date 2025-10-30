from app.core.config import settings
import numpy as np
from typing import Optional

_model = None


def get_model():
    """Lazily load the SentenceTransformer model. Raises RuntimeError if package not available.

    This avoids importing heavy NLP packages at application startup.
    """
    global _model
    if _model is None:
        try:
            # import inside function to avoid top-level import errors
            from sentence_transformers import SentenceTransformer
        except Exception as e:
            raise RuntimeError(
                "sentence-transformers not available. Install dependencies or check versions: " + str(e)
            )
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


def embed_text(text: str) -> list:
    """Return embedding list for given text. If model missing, raise RuntimeError."""
    model = get_model()
    vec = model.encode(text, show_progress_bar=False)
    return vec.tolist()


def cosine_sim(a: Optional[list], b: Optional[list]):
    if a is None or b is None:
        return 0.0
    a = np.array(a)
    b = np.array(b)
    if a.shape != b.shape:
        return 0.0
    num = a.dot(b)
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(num / denom)
