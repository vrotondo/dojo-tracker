from flask import Flask, request
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import Config
from app.models import db
from flask import jsonify

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    app.url_map.strict_slashes = False
    
    @app.before_request
    def log_request():
        print(f">>> Incoming {request.method} request to {request.path}")
        print(f">>> Headers: {dict(request.headers)}")
    
    db.init_app(app)
    jwt.init_app(app)
    
    CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
    
    @app.after_request
    def after_request(response):
        print(f">>> Responding with status {response.status_code}")
        return response
    
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({'error': 'Missing or invalid token'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    # Import models
    with app.app_context():
        from app.models.user import User
        from app.models.technique import Technique
        from app.models.analysis import VideoAnalysis
        from app.models.training_video import TrainingVideo
        from app.models.training_session import TrainingSession
        from app.models.user_technique_progress import UserTechniqueProgress
        
        db.create_all()
        print("✅ Database tables created/verified")
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.techniques import techniques_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(techniques_bp, url_prefix='/api/techniques')
    print("✅ Auth blueprint registered at /api/auth")
    print("✅ Techniques blueprint registered at /api/techniques")

    try:
        from app.routes.training import training_bp
        app.register_blueprint(training_bp, url_prefix='/api/training')
        print("✅ Training blueprint registered at /api/training")
    except ImportError as e:
        print(f"❌ Failed to import training blueprint: {e}")
    
    try:
        from app.routes.progress import progress_bp
        app.register_blueprint(progress_bp, url_prefix='/api/progress')
        print("✅ Progress blueprint registered at /api/progress")
    except ImportError as e:
        print(f"❌ Failed to import progress blueprint: {e}")
    
    return app