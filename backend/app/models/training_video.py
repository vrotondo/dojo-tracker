from datetime import datetime
from app.models import db

class TrainingVideo(db.Model):
    __tablename__ = 'training_videos'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    technique_id = db.Column(db.Integer, db.ForeignKey('techniques.id'), nullable=True)
    session_id = db.Column(db.Integer, db.ForeignKey('training_sessions.id'), nullable=True)
    
    # Video information
    title = db.Column(db.String(200), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    duration = db.Column(db.Float)
    
    # Technique details
    technique_name = db.Column(db.String(100))
    style = db.Column(db.String(50))
    
    # Metadata
    description = db.Column(db.Text)
    is_private = db.Column(db.Boolean, default=True)
    
    # Analysis status
    analysis_status = db.Column(db.String(20), default='pending')
    analysis_score = db.Column(db.Float)
    analysis_feedback = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'technique_id': self.technique_id,
            'session_id': self.session_id,
            'title': self.title,
            'filename': self.filename,
            'file_size': self.file_size,
            'duration': self.duration,
            'technique_name': self.technique_name,
            'style': self.style,
            'description': self.description,
            'is_private': self.is_private,
            'analysis_status': self.analysis_status,
            'analysis_score': self.analysis_score,
            'analysis_feedback': self.analysis_feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<TrainingVideo {self.id}: {self.title}>'