"""
Admin Routes for Bulk Operations
Provides endpoints for bulk importing and managing techniques
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.technique import Technique
from app.models.user import User

admin_bp = Blueprint('admin', __name__)


def is_admin():
    """Check if current user is admin (add admin field to User model if needed)"""
    # For now, just check if user exists
    # TODO: Add proper admin role check
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    return user is not None


@admin_bp.route('/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({'message': 'Admin routes working'}), 200


@admin_bp.route('/techniques/bulk-import', methods=['POST'])
@jwt_required()
def bulk_import_techniques():
    """
    Bulk import techniques
    Expected JSON format:
    {
        "techniques": [
            {
                "name": "Front Kick",
                "description": "A basic kick...",
                "style": "Karate",
                "difficulty": "Beginner",
                "category": "Kicks",
                "reference_video_url": "https://..."
            },
            ...
        ]
    }
    """
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        
        if not data or 'techniques' not in data:
            return jsonify({'error': 'Missing techniques data'}), 400
        
        techniques_data = data['techniques']
        
        if not isinstance(techniques_data, list):
            return jsonify({'error': 'Techniques must be an array'}), 400
        
        imported = 0
        skipped = 0
        errors = []
        
        for tech_data in techniques_data:
            try:
                # Validate required fields
                if not tech_data.get('name'):
                    errors.append({'name': 'missing', 'error': 'Name is required'})
                    continue
                
                # Check if already exists
                existing = Technique.query.filter_by(
                    name=tech_data['name'],
                    style=tech_data.get('style', 'General')
                ).first()
                
                if existing:
                    skipped += 1
                    continue
                
                # Create new technique
                technique = Technique(
                    name=tech_data['name'][:100],
                    description=tech_data.get('description', '')[:1000],
                    style=tech_data.get('style', 'General')[:50],
                    difficulty=tech_data.get('difficulty', 'Intermediate')[:20],
                    reference_video_url=tech_data.get('reference_video_url')
                )
                
                db.session.add(technique)
                imported += 1
                
            except Exception as e:
                errors.append({
                    'name': tech_data.get('name', 'unknown'),
                    'error': str(e)
                })
        
        # Commit all changes
        db.session.commit()
        
        return jsonify({
            'message': 'Bulk import completed',
            'imported': imported,
            'skipped': skipped,
            'errors': errors,
            'total_techniques': Technique.query.count()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Bulk import failed: {str(e)}'}), 500


@admin_bp.route('/techniques/stats', methods=['GET'])
@jwt_required()
def get_technique_stats():
    """Get statistics about techniques in database"""
    try:
        total = Technique.query.count()
        
        # Count by style
        styles = db.session.query(
            Technique.style,
            db.func.count(Technique.id)
        ).group_by(Technique.style).all()
        
        # Count by difficulty
        difficulties = db.session.query(
            Technique.difficulty,
            db.func.count(Technique.id)
        ).group_by(Technique.difficulty).all()
        
        return jsonify({
            'total': total,
            'by_style': {style: count for style, count in styles},
            'by_difficulty': {diff: count for diff, count in difficulties}
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500


@admin_bp.route('/techniques/bulk-delete', methods=['DELETE'])
@jwt_required()
def bulk_delete_techniques():
    """
    Bulk delete techniques
    Expected JSON format:
    {
        "technique_ids": [1, 2, 3, ...]
    }
    """
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        
        if not data or 'technique_ids' not in data:
            return jsonify({'error': 'Missing technique_ids'}), 400
        
        technique_ids = data['technique_ids']
        
        if not isinstance(technique_ids, list):
            return jsonify({'error': 'technique_ids must be an array'}), 400
        
        # Delete techniques
        deleted = Technique.query.filter(Technique.id.in_(technique_ids)).delete(synchronize_session=False)
        db.session.commit()
        
        return jsonify({
            'message': f'Deleted {deleted} techniques',
            'deleted_count': deleted,
            'total_remaining': Technique.query.count()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Bulk delete failed: {str(e)}'}), 500


@admin_bp.route('/techniques/clear-all', methods=['DELETE'])
@jwt_required()
def clear_all_techniques():
    """Clear all techniques (USE WITH CAUTION!)"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        count = Technique.query.count()
        Technique.query.delete()
        db.session.commit()
        
        return jsonify({
            'message': f'Cleared all {count} techniques',
            'deleted_count': count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Clear all failed: {str(e)}'}), 500