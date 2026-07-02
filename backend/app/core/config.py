import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="sqlite:///./medlaw_guard.db")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434")
    OLLAMA_MODEL: str = Field(default="qwen2.5:0.5b-instruct")
    LANCEDB_URI: str = Field(default="./data/lancedb")
    ENVIRONMENT: str = Field(default="development")
    LOG_LEVEL: str = Field(default="info")
    SECRET_KEY: str = Field(default="supersecretkeymedlawguard12345")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    GEMINI_API_KEY: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
