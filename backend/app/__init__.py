from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import Config
from app.models import db

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Disable strict slashes to prevent 308 redirects
    app.url_map.strict_slashes = False

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # CORS configuration - must be very permissive for development
    CORS(app)
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Handle JWT errors without redirects
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({'error': 'Missing or invalid token'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    # Import models here to ensure they're registered
    with app.app_context():
        from app.models.user import User
        from app.models.technique import Technique
        from app.models.analysis import VideoAnalysis
        
        # Create tables
        db.create_all()
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.techniques import techniques_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(techniques_bp, url_prefix='/api/techniques')
    
    return app