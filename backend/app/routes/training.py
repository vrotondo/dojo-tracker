from datetime import datetime
import os
import uuid
import traceback
from sqlalchemy import func
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request, decode_token
from app.models import db
from app.models.training_video import TrainingVideo
from app.models.technique import Technique
from app.models.training_session import TrainingSession

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

@training_bp.route('/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({'message': 'Training routes working'}), 200

@training_bp.route('/videos', methods=['GET'])
@jwt_required()
def get_videos():
    """Get all videos for current user"""
    try:
        print(">>> Getting videos...")
        current_user_id = get_current_user_id()
        print(f">>> User ID: {current_user_id}")
        
        # Optional filters
        technique_id = request.args.get('technique_id', type=int)
        style = request.args.get('style')
        technique_name = request.args.get('technique_name')
        limit = request.args.get('limit', type=int, default=50)
        offset = request.args.get('offset', type=int, default=0)
        
        print(f">>> Building query for user {current_user_id}...")
        # Build query
        query = TrainingVideo.query.filter_by(user_id=current_user_id)
        
        if technique_id:
            query = query.filter_by(technique_id=technique_id)
        if style:
            query = query.filter_by(style=style)
        if technique_name:
            query = query.filter_by(technique_name=technique_name)
        
        print(">>> Getting count...")
        # Get total count
        total_count = query.count()
        print(f">>> Total videos: {total_count}")
        
        print(">>> Fetching videos...")
        # Apply pagination
        videos = query.order_by(TrainingVideo.created_at.desc()).limit(limit).offset(offset).all()
        print(f">>> Found {len(videos)} videos")
        
        print(">>> Converting to dict...")
        video_dicts = [video.to_dict() for video in videos]
        
        return jsonify({
            'videos': video_dicts,
            'count': len(videos),
            'total': total_count,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        print(f"!!! ERROR getting videos: {str(e)}")
        print(f"!!! Error type: {type(e).__name__}")
        print(f"!!! Full traceback:")
        traceback.print_exc()
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
        print(f"Error getting video: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Failed to get video: {str(e)}'}), 500

@training_bp.route('/videos', methods=['POST'])
@jwt_required()
def upload_video():
    """Upload a new training video"""
    try:
        print(">>> Starting video upload...")
        current_user_id = get_current_user_id()
        print(f">>> User ID: {current_user_id}")
        
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
        
        print(f">>> Technique ID: {technique_id}, Name: {technique_name}")
        
        # Generate unique filename
        upload_dir = ensure_upload_directory()
        extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"user_{current_user_id}_{uuid.uuid4()}.{extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        print(f">>> Saving file to: {file_path}")
        # Save file
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        print(f">>> File saved, size: {file_size}")
        
        # Create database entry
        print(">>> Creating database entry...")
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
        print(">>> Video saved to database successfully!")
        
        return jsonify({
            'message': 'Video uploaded successfully',
            'video': new_video.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"!!! Upload error: {str(e)}")
        print(f"!!! Error type: {type(e).__name__}")
        traceback.print_exc()
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
        print(f"Update error: {str(e)}")
        traceback.print_exc()
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
        print(f"Delete error: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Delete failed: {str(e)}'}), 500

@training_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get all training sessions for current user"""
    try:
        current_user_id = get_current_user_id()
        
        style = request.args.get('style')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', type=int, default=50)
        offset = request.args.get('offset', type=int, default=0)
        
        query = TrainingSession.query.filter_by(user_id=current_user_id)
        
        if style:
            query = query.filter_by(style=style)
        if start_date:
            query = query.filter(TrainingSession.session_date >= start_date)
        if end_date:
            query = query.filter(TrainingSession.session_date <= end_date)
        
        total_count = query.count()
        sessions = query.order_by(TrainingSession.session_date.desc()).limit(limit).offset(offset).all()
        
        return jsonify({
            'sessions': [session.to_dict() for session in sessions],
            'count': len(sessions),
            'total': total_count,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        print(f"Error getting sessions: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Failed to get sessions: {str(e)}'}), 500

@training_bp.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get a specific training session with linked videos"""
    try:
        current_user_id = get_current_user_id()
        
        session = TrainingSession.query.filter_by(id=session_id, user_id=current_user_id).first()
        
        if not session:
            return jsonify({'message': 'Session not found'}), 404
        
        videos = TrainingVideo.query.filter_by(session_id=session_id).all()
        
        session_data = session.to_dict()
        session_data['videos'] = [video.to_dict() for video in videos]
        session_data['video_count'] = len(videos)
        
        return jsonify({'session': session_data}), 200
        
    except Exception as e:
        print(f"Error getting session: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Failed to get session: {str(e)}'}), 500

@training_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    """Create a new training session"""
    try:
        current_user_id = get_current_user_id()
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'message': 'Title is required'}), 400
        
        session_date = datetime.utcnow()
        if data.get('session_date'):
            try:
                session_date = datetime.fromisoformat(data['session_date'].replace('Z', '+00:00'))
            except:
                pass
        
        new_session = TrainingSession(
            user_id=current_user_id,
            title=data['title'],
            style=data.get('style', ''),
            duration=data.get('duration', 0),
            intensity=data.get('intensity', 'Medium'),
            description=data.get('description', ''),
            notes=data.get('notes', ''),
            location=data.get('location', ''),
            session_date=session_date
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify({
            'message': 'Session created successfully',
            'session': new_session.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Create session error: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Failed to create session: {str(e)}'}), 500

@training_bp.route('/sessions/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    """Update a training session"""
    try:
        current_user_id = get_current_user_id()
        
        session = TrainingSession.query.filter_by(id=session_id, user_id=current_user_id).first()
        
        if not session:
            return jsonify({'message': 'Session not found'}), 404
        
        data = request.get_json()
        
        if 'title' in data:
            session.title = data['title']
        if 'style' in data:
            session.style = data['style']
        if 'duration' in data:
            session.duration = data['duration']
        if 'intensity' in data:
            session.intensity = data['intensity']
        if 'description' in data:
            session.description = data['description']
        if 'notes' in data:
            session.notes = data['notes']
        if 'location' in data:
            session.location = data['location']
        if 'session_date' in data:
            try:
                session.session_date = datetime.fromisoformat(data['session_date'].replace('Z', '+00:00'))
            except:
                pass
        
        db.session.commit()
        
        return jsonify({
            'message': 'Session updated successfully',
            'session': session.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Update session error: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Update failed: {str(e)}'}), 500

@training_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    """Delete a training session"""
    try:
        current_user_id = get_current_user_id()
        
        session = TrainingSession.query.filter_by(id=session_id, user_id=current_user_id).first()
        
        if not session:
            return jsonify({'message': 'Session not found'}), 404
        
        # Unlink videos (don't delete them, just remove session_id)
        TrainingVideo.query.filter_by(session_id=session_id).update({'session_id': None})
        
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({'message': 'Session deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Delete session error: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Delete failed: {str(e)}'}), 500

@training_bp.route('/sessions/stats', methods=['GET'])
@jwt_required()
def get_session_stats():
    """Get training session statistics"""
    try:
        current_user_id = get_current_user_id()
        
        total_sessions = TrainingSession.query.filter_by(user_id=current_user_id).count()
        
        total_duration = db.session.query(func.sum(TrainingSession.duration)).filter_by(user_id=current_user_id).scalar() or 0
        
        sessions_by_style = db.session.query(
            TrainingSession.style,
            func.count(TrainingSession.id),
            func.sum(TrainingSession.duration)
        ).filter_by(user_id=current_user_id).group_by(TrainingSession.style).all()
        
        recent_sessions = TrainingSession.query.filter_by(user_id=current_user_id).order_by(
            TrainingSession.session_date.desc()
        ).limit(5).all()
        
        hours = int(total_duration // 60)
        minutes = int(total_duration % 60)
        duration_formatted = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
        return jsonify({
            'total_sessions': total_sessions,
            'total_duration': total_duration,
            'duration_formatted': duration_formatted,
            'sessions_by_style': [
                {'style': style, 'count': count, 'total_duration': duration}
                for style, count, duration in sessions_by_style
            ],
            'recent_sessions': [session.to_dict() for session in recent_sessions]
        }), 200
        
    except Exception as e:
        print(f"Stats error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500
    
@training_bp.route('/videos/<int:video_id>/stream', methods=['GET'])
def stream_video(video_id):
    """Stream video file - allows token in query param for video <src> tags"""
    try:
        # Try to get token from Authorization header first
        try:
            verify_jwt_in_request()
            current_user_id = get_current_user_id()
        except:
            # If header auth fails, try query parameter (for video src tags)
            token = request.args.get('token')
            if not token:
                return jsonify({'message': 'No authentication token provided'}), 401
            
            try:
                # Manually decode and verify the token
                from flask_jwt_extended import decode_token
                decoded = decode_token(token)
                current_user_id = int(decoded['sub'])
            except:
                return jsonify({'message': 'Invalid token'}), 401
        
        video = TrainingVideo.query.filter_by(id=video_id, user_id=current_user_id).first()
        
        if not video:
            return jsonify({'message': 'Video not found'}), 404
        
        if not os.path.exists(video.file_path):
            return jsonify({'message': 'Video file not found on server'}), 404
        
        # Get file extension
        extension = video.filename.rsplit('.', 1)[1].lower() if '.' in video.filename else 'webm'
        
        return send_file(
            video.file_path,
            mimetype=f'video/{extension}',
            as_attachment=False
        )
        
    except Exception as e:
        print(f"Stream error: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Stream failed: {str(e)}'}), 500