from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import db
from app.models.technique import Technique

techniques_bp = Blueprint('techniques', __name__)

@techniques_bp.route('/', methods=['GET', 'OPTIONS'])
def get_techniques():
    # Handle preflight
    if request.method == 'OPTIONS':
        return '', 200
    
    # Verify JWT manually with detailed error logging
    try:
        print(">>> Attempting JWT verification...")
        verify_jwt_in_request()
        user_id = int(get_jwt_identity())
        print(f">>> JWT verified successfully for user {user_id}")
    except Exception as e:
        print(f">>> JWT verification failed: {type(e).__name__}: {str(e)}")
        return jsonify({'error': 'Unauthorized', 'details': str(e)}), 401
    
    # Optional filters
    style = request.args.get('style')
    difficulty = request.args.get('difficulty')
    
    query = Technique.query
    
    if style:
        query = query.filter_by(style=style)
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    
    techniques = query.all()
    
    return jsonify({
        'techniques': [t.to_dict() for t in techniques]
    }), 200

@techniques_bp.route('/<int:technique_id>', methods=['GET', 'OPTIONS'])
def get_technique(technique_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        verify_jwt_in_request()
        user_id = int(get_jwt_identity())
    except Exception as e:
        print(f">>> JWT verification failed: {type(e).__name__}: {str(e)}")
        return jsonify({'error': 'Unauthorized'}), 401
    
    technique = Technique.query.get(technique_id)
    
    if not technique:
        return jsonify({'error': 'Technique not found'}), 404
    
    return jsonify({'technique': technique.to_dict()}), 200