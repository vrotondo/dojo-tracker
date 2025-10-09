from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import func
from app.models import db
from app.models.user import User

# Import TrainingVideo - may not exist yet
try:
    from app.models.training_video import TrainingVideo
except ImportError:
    TrainingVideo = None

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'User registered successfully',
        'access_token': access_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'username' in data and data['username'] != user.username:
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user:
                return jsonify({'error': 'Username already exists'}), 400
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user:
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

@auth_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to change password: {str(e)}'}), 500

@auth_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user training statistics - safe fallback version"""
    try:
        user_id = int(get_jwt_identity())
        print(f">>> Getting stats for user {user_id}")
        
        # Default stats to return
        default_stats = {
            'total_videos': 0,
            'total_duration': 0,
            'duration_formatted': '0m',
            'analyzed_videos': 0,
            'videos_by_style': {}
        }
        
        # Check if TrainingVideo table exists and is imported
        if TrainingVideo is None:
            print(">>> TrainingVideo model not available, returning default stats")
            return jsonify(default_stats), 200
        
        try:
            total_videos = TrainingVideo.query.filter_by(user_id=user_id).count()
            print(f">>> Found {total_videos} videos")
            
            total_duration = db.session.query(func.sum(TrainingVideo.duration)).filter_by(user_id=user_id).scalar()
            total_duration = total_duration if total_duration else 0
            
            try:
                videos_by_style = db.session.query(
                    TrainingVideo.style,
                    func.count(TrainingVideo.id)
                ).filter_by(user_id=user_id).filter(TrainingVideo.style.isnot(None)).group_by(TrainingVideo.style).all()
                videos_by_style_dict = dict(videos_by_style) if videos_by_style else {}
            except Exception as e:
                print(f">>> Error getting videos by style: {e}")
                videos_by_style_dict = {}
            
            try:
                analyzed_videos = TrainingVideo.query.filter_by(
                    user_id=user_id,
                    analysis_status='completed'
                ).count()
            except Exception as e:
                print(f">>> Error getting analyzed videos: {e}")
                analyzed_videos = 0
            
            hours = int(total_duration // 3600)
            minutes = int((total_duration % 3600) // 60)
            duration_formatted = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
            
            return jsonify({
                'total_videos': total_videos,
                'total_duration': total_duration,
                'duration_formatted': duration_formatted,
                'analyzed_videos': analyzed_videos,
                'videos_by_style': videos_by_style_dict
            }), 200
            
        except Exception as db_error:
            print(f">>> Database error in stats: {db_error}")
            return jsonify(default_stats), 200
        
    except Exception as e:
        print(f">>> Stats error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return empty stats instead of error to prevent UI crash
        return jsonify({
            'total_videos': 0,
            'total_duration': 0,
            'duration_formatted': '0m',
            'analyzed_videos': 0,
            'videos_by_style': {}
        }), 200