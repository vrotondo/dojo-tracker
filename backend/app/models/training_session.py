from datetime import datetime
from app.models import db

class TrainingSession(db.Model):
    __tablename__ = 'training_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Session details
    title = db.Column(db.String(200), nullable=False)
    style = db.Column(db.String(50))
    duration = db.Column(db.Integer)  # Duration in minutes
    intensity = db.Column(db.String(20))  # Low, Medium, High
    
    # Session metadata
    description = db.Column(db.Text)
    notes = db.Column(db.Text)
    location = db.Column(db.String(100))
    
    # Timestamps
    session_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'style': self.style,
            'duration': self.duration,
            'intensity': self.intensity,
            'description': self.description,
            'notes': self.notes,
            'location': self.location,
            'session_date': self.session_date.isoformat() if self.session_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<TrainingSession {self.id}: {self.title}>'