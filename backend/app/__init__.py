from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import Config
from app.models import db

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.techniques import techniques_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(techniques_bp, url_prefix='/api/techniques')
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app