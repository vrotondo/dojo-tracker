import os
import uuid
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.training_video import TrainingVideo
from app.models.technique import Technique

training_bp = Blueprint('training', __name__)

# Configuration
UPLOAD_FOLDER = 'uploads/videos'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v'}

def ensure_upload_directory():
    """Ensure upload directory exists"""
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    return UPLOAD_FOLDER

def get_current_user_id():
    """Get current user ID from JWT token"""
    user_id_str = get_jwt_identity()
    return int(user_id_str)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

@training_bp.route('/videos', methods=['GET'])
@jwt_required()
def get_videos():
    """Get all videos for current user"""
    try:
        current_user_id = get_current_user_id()
        
        # Optional filters
        technique_id = request.args.get('technique_id', type=int)
        style = request.args.get('style')
        technique_name = request.args.get('technique_name')
        limit = request.args.get('limit', type=int, default=50)
        offset = request.args.get('offset', type=int, default=0)
        
        # Build query
        query = TrainingVideo.query.filter_by(user_id=current_user_id)
        
        if technique_id:
            query = query.filter_by(technique_id=technique_id)
        if style:
            query = query.filter_by(style=style)
        if technique_name:
            query = query.filter_by(technique_name=technique_name)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        videos = query.order_by(TrainingVideo.created_at.desc()).limit(limit).offset(offset).all()
        
        return jsonify({
            'videos': [video.to_dict() for video in videos],
            'count': len(videos),
            'total': total_count,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        print(f"Error getting videos: {str(e)}")
        return jsonify({'message': f'Failed to get videos: {str(e)}'}), 500

@training_bp.route('/videos/<int:video_id>', methods=['GET'])
@jwt_required()
def get_video(video_id):
    """Get a specific video"""
    try:
        current_user_id = get_current_user_id()
        
        video = TrainingVideo.query.filter_by(id=video_id, user_id=current_user_id).first()
        
        if not video:
            return jsonify({'message': 'Video not found'}), 404
        
        return jsonify({'video': video.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get video: {str(e)}'}), 500

@training_bp.route('/videos', methods=['POST'])
@jwt_required()
def upload_video():
    """Upload a new training video"""
    try:
        current_user_id = get_current_user_id()
        
        # Validate file
        if 'video' not in request.files:
            return jsonify({'message': 'No video file provided'}), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({'message': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'message': f'Invalid file type. Allowed: {", ".join(ALLOWED_VIDEO_EXTENSIONS)}'
            }), 400
        
        # Get form data
        title = request.form.get('title', 'Untitled Training Video')
        technique_name = request.form.get('technique_name', '')
        style = request.form.get('style', '')
        description = request.form.get('description', '')
        is_private = request.form.get('is_private', 'true').lower() == 'true'
        technique_id = request.form.get('technique_id', type=int)
        
        # Generate unique filename
        upload_dir = ensure_upload_directory()
        extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"user_{current_user_id}_{uuid.uuid4()}.{extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # Create database entry
        new_video = TrainingVideo(
            user_id=current_user_id,
            technique_id=technique_id,
            title=title,
            filename=unique_filename,
            file_path=file_path,
            file_size=file_size,
            technique_name=technique_name,
            style=style,
            description=description,
            is_private=is_private,
            analysis_status='pending'
        )
        
        db.session.add(new_video)
        db.session.commit()
        
        return jsonify({
            'message': 'Video uploaded successfully',
            'video': new_video.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Upload error: {str(e)}")
        return jsonify({'message': f'Upload failed: {str(e)}'}), 500

@training_bp.route('/videos/<int:video_id>', methods=['PUT'])
@jwt_required()
def update_video(video_id):
    """Update video metadata"""
    try:
        current_user_id = get_current_user_id()
        
        video = TrainingVideo.query.filter_by(id=video_id, user_id=current_user_id).first()
        
        if not video:
            return jsonify({'message': 'Video not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'title' in data:
            video.title = data['title']
        if 'description' in data:
            video.description = data['description']
        if 'is_private' in data:
            video.is_private = data['is_private']
        if 'technique_id' in data:
            video.technique_id = data['technique_id']
            # Update technique name and style if technique_id is provided
            if data['technique_id']:
                technique = Technique.query.get(data['technique_id'])
                if technique:
                    video.technique_name = technique.name
                    video.style = technique.style
        
        db.session.commit()
        
        return jsonify({
            'message': 'Video updated successfully',
            'video': video.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Update failed: {str(e)}'}), 500

@training_bp.route('/videos/<int:video_id>', methods=['DELETE'])
@jwt_required()
def delete_video(video_id):
    """Delete a video"""
    try:
        current_user_id = get_current_user_id()
        
        video = TrainingVideo.query.filter_by(id=video_id, user_id=current_user_id).first()
        
        if not video:
            return jsonify({'message': 'Video not found'}), 404
        
        # Delete file from filesystem
        try:
            if os.path.exists(video.file_path):
                os.remove(video.file_path)
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
        
        # Delete from database
        db.session.delete(video)
        db.session.commit()
        
        return jsonify({'message': 'Video deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Delete failed: {str(e)}'}), 500

@training_bp.route('/videos/<int:video_id>/stream', methods=['GET'])
@jwt_required()
def stream_video(video_id):
    """Stream video file"""
    try:
        current_user_id = get_current_user_id()
        
        video = TrainingVideo.query.filter_by(id=video_id, user_id=current_user_id).first()
        
        if not video:
            return jsonify({'message': 'Video not found'}), 404
        
        if not os.path.exists(video.file_path):
            return jsonify({'message': 'Video file not found on server'}), 404
        
        return send_file(
            video.file_path,
            mimetype=f'video/{video.filename.rsplit(".", 1)[1].lower()}',
            as_attachment=False
        )
        
    except Exception as e:
        return jsonify({'message': f'Stream failed: {str(e)}'}), 500

@training_bp.route('/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({'message': 'Training routes working'}), 200