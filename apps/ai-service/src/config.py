from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AssetFlow AI Service"
    DEBUG: bool = False
    VERSION: str = "1.0.0"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["*"]
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://localhost:5432/assetflow")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_TTL: int = 3600
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = 0.7
    
    # AI Models
    DOCUMENT_ANALYSIS_MODEL: str = "gpt-4-turbo-preview"
    VALUATION_MODEL: str = "gpt-4-turbo-preview"
    RISK_MODEL: str = "gpt-4-turbo-preview"
    COMPLIANCE_MODEL: str = "gpt-4-turbo-preview"
    
    # File Storage
    UPLOAD_DIR: str = "/tmp/uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".jpg", ".png"]
    
    # Cache
    CACHE_TTL: int = 3600
    CACHE_PREFIX: str = "assetflow:ai:"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
