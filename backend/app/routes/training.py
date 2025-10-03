import os
import uuid
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

training_bp = Blueprint('training', __name__)

# Configuration
UPLOAD_FOLDER = 'uploads/videos'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v'}

def ensure_upload_directory():
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    return UPLOAD_FOLDER

def get_current_user_id():
    user_id_str = get_jwt_identity()
    return int(user_id_str)

@training_bp.route('/videos', methods=['GET'])
@jwt_required()
def get_videos():
    try:
        current_user_id = get_current_user_id()
        
        # For now, return empty array since TrainingVideo model doesn't exist yet
        return jsonify({
            'videos': [],
            'count': 0,
            'message': 'No videos found'
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get videos: {str(e)}'}), 500

@training_bp.route('/videos', methods=['POST'])
@jwt_required()
def upload_video():
    try:
        current_user_id = get_current_user_id()
        
        if 'video' not in request.files:
            return jsonify({'message': 'No video file provided'}), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({'message': 'No file selected'}), 400
        
        # Validate file
        extension = file.filename.rsplit('.', 1)[1].lower()
        if extension not in ALLOWED_VIDEO_EXTENSIONS:
            return jsonify({'message': f'Invalid file type. Allowed: {", ".join(ALLOWED_VIDEO_EXTENSIONS)}'}), 400
        
        # Save file
        upload_dir = ensure_upload_directory()
        unique_filename = f"user_{current_user_id}_{uuid.uuid4()}.{extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        return jsonify({
            'message': 'Video uploaded successfully',
            'video': {
                'id': 1,
                'filename': unique_filename,
                'technique_name': request.form.get('technique_name'),
                'style': request.form.get('style')
            }
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Upload failed: {str(e)}'}), 500

@training_bp.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Training routes working'}), 200