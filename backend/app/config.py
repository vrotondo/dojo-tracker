import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database - PostgreSQL
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:LazerDog%4091%21@localhost:5434/dojotracker')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # CORS
    CORS_HEADERS = 'Content-Type'