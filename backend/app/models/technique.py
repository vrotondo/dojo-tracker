from datetime import datetime
from app.models import db

class Technique(db.Model):
    __tablename__ = 'techniques'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    style = db.Column(db.String(50))
    difficulty = db.Column(db.String(20))
    reference_video_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    video_analyses = db.relationship('VideoAnalysis', backref='technique', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'style': self.style,
            'difficulty': self.difficulty,
            'reference_video_url': self.reference_video_url,
            'created_at': self.created_at.isoformat()
        }