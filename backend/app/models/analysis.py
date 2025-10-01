from datetime import datetime
from app.models import db

class VideoAnalysis(db.Model):
    __tablename__ = 'video_analyses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    technique_id = db.Column(db.Integer, db.ForeignKey('techniques.id'), nullable=False)
    video_path = db.Column(db.String(255), nullable=False)
    score = db.Column(db.Float)
    feedback = db.Column(db.Text)
    analysis_data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'technique_id': self.technique_id,
            'video_path': self.video_path,
            'score': self.score,
            'feedback': self.feedback,
            'analysis_data': self.analysis_data,
            'created_at': self.created_at.isoformat()
        }