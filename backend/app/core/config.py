"""
Configuration management using Pydantic settings
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "transcription_db"
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    HF_TOKEN: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Model paths
    WHISPER_MODEL: str = "base"  # tiny, base, small, medium, large
    EMOTION_MODEL: str = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
