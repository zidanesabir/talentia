import os
from pydantic import BaseSettings


class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017/talentia"
    SECRET_KEY: str = "1238476asdhjkasdhjkashdjkashdjkashd"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", ".env")


settings = Settings()
