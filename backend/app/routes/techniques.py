from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from jwt.exceptions import PyJWTError
from app.models import db
from app.models.technique import Technique

techniques_bp = Blueprint('techniques', __name__)

@techniques_bp.route('/', methods=['GET', 'OPTIONS'])
def get_techniques():
    # Handle preflight
    if request.method == 'OPTIONS':
        return '', 200
    
    # Verify JWT manually to avoid redirect issues
    try:
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({'error': 'Unauthorized'}), 401
    
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
    except Exception as e:
        return jsonify({'error': 'Unauthorized'}), 401
    
    technique = Technique.query.get(technique_id)
    
    if not technique:
        return jsonify({'error': 'Technique not found'}), 404
    
    return jsonify({'technique': technique.to_dict()}), 200

@techniques_bp.route('/', methods=['POST'])
def create_technique():
    try:
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    # Validation
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    technique = Technique(
        name=data['name'],
        description=data.get('description'),
        style=data.get('style'),
        difficulty=data.get('difficulty'),
        reference_video_url=data.get('reference_video_url')
    )
    
    db.session.add(technique)
    db.session.commit()
    
    return jsonify({
        'message': 'Technique created successfully',
        'technique': technique.to_dict()
    }), 201