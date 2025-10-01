import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database - SQLite (no setup needed!)
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dojotracker.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # CORS
    CORS_HEADERS = 'Content-Type'