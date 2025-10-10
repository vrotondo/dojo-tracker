from datetime import datetime
from app.models import db

class UserTechniqueProgress(db.Model):
    __tablename__ = 'user_technique_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    technique_id = db.Column(db.Integer, db.ForeignKey('techniques.id'), nullable=False)
    
    # Progress tracking
    proficiency_status = db.Column(db.String(20), default='learning')  # learning, practicing, mastered
    is_favorite = db.Column(db.Boolean, default=False)
    
    # Personal notes and goals
    notes = db.Column(db.Text)
    personal_goal = db.Column(db.String(500))
    
    # Practice statistics
    practice_count = db.Column(db.Integer, default=0)
    total_practice_time = db.Column(db.Integer, default=0)  # in minutes
    
    # Progress milestones
    first_practiced = db.Column(db.DateTime)
    last_practiced = db.Column(db.DateTime)
    mastered_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint - each user can only track a technique once
    __table_args__ = (
        db.UniqueConstraint('user_id', 'technique_id', name='unique_user_technique'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'technique_id': self.technique_id,
            'proficiency_status': self.proficiency_status,
            'is_favorite': self.is_favorite,
            'notes': self.notes,
            'personal_goal': self.personal_goal,
            'practice_count': self.practice_count,
            'total_practice_time': self.total_practice_time,
            'first_practiced': self.first_practiced.isoformat() if self.first_practiced else None,
            'last_practiced': self.last_practiced.isoformat() if self.last_practiced else None,
            'mastered_at': self.mastered_at.isoformat() if self.mastered_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def to_dict_with_technique(self):
        """Include technique details in the response"""
        from app.models.technique import Technique
        
        data = self.to_dict()
        technique = Technique.query.get(self.technique_id)
        data['technique'] = technique.to_dict() if technique else None
        return data
    
    def __repr__(self):
        return f'<UserTechniqueProgress User:{self.user_id} Technique:{self.technique_id} Status:{self.proficiency_status}>'