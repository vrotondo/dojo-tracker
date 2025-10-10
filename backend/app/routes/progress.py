from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.models import db
from app.models.user_technique_progress import UserTechniqueProgress
from app.models.technique import Technique
from app.models.training_video import TrainingVideo

progress_bp = Blueprint('progress', __name__)

def get_current_user_id():
    """Get current user ID from JWT token"""
    user_id_str = get_jwt_identity()
    return int(user_id_str)

@progress_bp.route('/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({'message': 'Progress routes working'}), 200

@progress_bp.route('/techniques', methods=['GET'])
@jwt_required()
def get_all_progress():
    """Get all technique progress for current user"""
    try:
        current_user_id = get_current_user_id()
        
        # Optional filters
        proficiency_status = request.args.get('status')
        favorites_only = request.args.get('favorites', 'false').lower() == 'true'
        
        # Build query
        query = UserTechniqueProgress.query.filter_by(user_id=current_user_id)
        
        if proficiency_status:
            query = query.filter_by(proficiency_status=proficiency_status)
        if favorites_only:
            query = query.filter_by(is_favorite=True)
        
        progress_items = query.all()
        
        return jsonify({
            'progress': [p.to_dict_with_technique() for p in progress_items],
            'count': len(progress_items)
        }), 200
        
    except Exception as e:
        print(f"Error getting progress: {str(e)}")
        return jsonify({'message': f'Failed to get progress: {str(e)}'}), 500

@progress_bp.route('/techniques/<int:technique_id>', methods=['GET'])
@jwt_required()
def get_technique_progress(technique_id):
    """Get progress for a specific technique"""
    try:
        current_user_id = get_current_user_id()
        
        progress = UserTechniqueProgress.query.filter_by(
            user_id=current_user_id,
            technique_id=technique_id
        ).first()
        
        if not progress:
            return jsonify({'message': 'Progress not found', 'tracking': False}), 404
        
        return jsonify({
            'progress': progress.to_dict_with_technique(),
            'tracking': True
        }), 200
        
    except Exception as e:
        print(f"Error getting technique progress: {str(e)}")
        return jsonify({'message': f'Failed to get progress: {str(e)}'}), 500

@progress_bp.route('/techniques/<int:technique_id>', methods=['POST'])
@jwt_required()
def start_tracking_technique(technique_id):
    """Start tracking progress for a technique"""
    try:
        current_user_id = get_current_user_id()
        
        # Check if technique exists
        technique = Technique.query.get(technique_id)
        if not technique:
            return jsonify({'message': 'Technique not found'}), 404
        
        # Check if already tracking
        existing = UserTechniqueProgress.query.filter_by(
            user_id=current_user_id,
            technique_id=technique_id
        ).first()
        
        if existing:
            return jsonify({
                'message': 'Already tracking this technique',
                'progress': existing.to_dict_with_technique()
            }), 200
        
        # Create new progress entry
        new_progress = UserTechniqueProgress(
            user_id=current_user_id,
            technique_id=technique_id,
            proficiency_status='learning',
            first_practiced=datetime.utcnow()
        )
        
        db.session.add(new_progress)
        db.session.commit()
        
        return jsonify({
            'message': 'Started tracking technique',
            'progress': new_progress.to_dict_with_technique()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error starting progress tracking: {str(e)}")
        return jsonify({'message': f'Failed to start tracking: {str(e)}'}), 500

@progress_bp.route('/techniques/<int:technique_id>', methods=['PUT'])
@jwt_required()
def update_technique_progress(technique_id):
    """Update progress for a technique"""
    try:
        current_user_id = get_current_user_id()
        
        progress = UserTechniqueProgress.query.filter_by(
            user_id=current_user_id,
            technique_id=technique_id
        ).first()
        
        if not progress:
            return jsonify({'message': 'Progress not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'proficiency_status' in data:
            old_status = progress.proficiency_status
            new_status = data['proficiency_status']
            
            if new_status in ['learning', 'practicing', 'mastered']:
                progress.proficiency_status = new_status
                
                # Set mastered_at timestamp if changing to mastered
                if new_status == 'mastered' and old_status != 'mastered':
                    progress.mastered_at = datetime.utcnow()
                elif new_status != 'mastered':
                    progress.mastered_at = None
        
        if 'is_favorite' in data:
            progress.is_favorite = data['is_favorite']
        
        if 'notes' in data:
            progress.notes = data['notes']
        
        if 'personal_goal' in data:
            progress.personal_goal = data['personal_goal']
        
        # Update last practiced
        if 'mark_practiced' in data and data['mark_practiced']:
            progress.last_practiced = datetime.utcnow()
            progress.practice_count += 1
            
            # Add practice time if provided
            if 'practice_duration' in data:
                progress.total_practice_time += int(data['practice_duration'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Progress updated successfully',
            'progress': progress.to_dict_with_technique()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating progress: {str(e)}")
        return jsonify({'message': f'Failed to update progress: {str(e)}'}), 500

@progress_bp.route('/techniques/<int:technique_id>', methods=['DELETE'])
@jwt_required()
def stop_tracking_technique(technique_id):
    """Stop tracking a technique"""
    try:
        current_user_id = get_current_user_id()
        
        progress = UserTechniqueProgress.query.filter_by(
            user_id=current_user_id,
            technique_id=technique_id
        ).first()
        
        if not progress:
            return jsonify({'message': 'Progress not found'}), 404
        
        db.session.delete(progress)
        db.session.commit()
        
        return jsonify({'message': 'Stopped tracking technique'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting progress: {str(e)}")
        return jsonify({'message': f'Failed to delete progress: {str(e)}'}), 500

@progress_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_progress_stats():
    """Get overall progress statistics for the user"""
    try:
        current_user_id = get_current_user_id()
        
        # Total techniques being tracked
        total_tracked = UserTechniqueProgress.query.filter_by(user_id=current_user_id).count()
        
        # Count by proficiency status
        status_counts = db.session.query(
            UserTechniqueProgress.proficiency_status,
            func.count(UserTechniqueProgress.id)
        ).filter_by(user_id=current_user_id).group_by(
            UserTechniqueProgress.proficiency_status
        ).all()
        
        # Favorites count
        favorites_count = UserTechniqueProgress.query.filter_by(
            user_id=current_user_id,
            is_favorite=True
        ).count()
        
        # Total practice sessions across all techniques
        total_practices = db.session.query(
            func.sum(UserTechniqueProgress.practice_count)
        ).filter_by(user_id=current_user_id).scalar() or 0
        
        # Total practice time
        total_time = db.session.query(
            func.sum(UserTechniqueProgress.total_practice_time)
        ).filter_by(user_id=current_user_id).scalar() or 0
        
        # Recently practiced techniques
        recent = UserTechniqueProgress.query.filter_by(
            user_id=current_user_id
        ).filter(
            UserTechniqueProgress.last_practiced.isnot(None)
        ).order_by(
            UserTechniqueProgress.last_practiced.desc()
        ).limit(5).all()
        
        return jsonify({
            'total_tracked': total_tracked,
            'by_status': {status: count for status, count in status_counts},
            'favorites_count': favorites_count,
            'total_practices': int(total_practices),
            'total_practice_time': int(total_time),
            'recently_practiced': [p.to_dict_with_technique() for p in recent]
        }), 200
        
    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        return jsonify({'message': f'Failed to get stats: {str(e)}'}), 500