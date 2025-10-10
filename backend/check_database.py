"""
Quick script to check database status and create a test user
Run this from your backend directory: python check_database.py
"""

from app import create_app, db
from app.models.user import User
from app.models.technique import Technique
from app.models.user_technique_progress import UserTechniqueProgress
from app.models.training_session import TrainingSession
from app.models.training_video import TrainingVideo

app = create_app()

with app.app_context():
    print("\n" + "="*50)
    print("🔍 DATABASE STATUS CHECK")
    print("="*50 + "\n")
    
    # Check all tables exist
    print("📋 Checking tables...")
    try:
        user_count = User.query.count()
        print(f"  ✅ Users table: {user_count} users")
    except Exception as e:
        print(f"  ❌ Users table error: {e}")
    
    try:
        technique_count = Technique.query.count()
        print(f"  ✅ Techniques table: {technique_count} techniques")
    except Exception as e:
        print(f"  ❌ Techniques table error: {e}")
    
    try:
        progress_count = UserTechniqueProgress.query.count()
        print(f"  ✅ Progress table: {progress_count} records")
    except Exception as e:
        print(f"  ❌ Progress table error: {e}")
    
    try:
        session_count = TrainingSession.query.count()
        print(f"  ✅ Training sessions table: {session_count} sessions")
    except Exception as e:
        print(f"  ❌ Training sessions table error: {e}")
    
    try:
        video_count = TrainingVideo.query.count()
        print(f"  ✅ Training videos table: {video_count} videos")
    except Exception as e:
        print(f"  ❌ Training videos table error: {e}")
    
    print("\n" + "-"*50 + "\n")
    
    # List all users
    print("👥 Current Users:")
    users = User.query.all()
    if users:
        for user in users:
            print(f"  • ID: {user.id} | Username: {user.username} | Email: {user.email}")
    else:
        print("  ⚠️  No users found in database!")
        print("\n💡 You need to register a new account in the app.")
    
    print("\n" + "-"*50 + "\n")
    
    # Check techniques
    print("🥋 Techniques in Library:")
    techniques = Technique.query.limit(5).all()
    if techniques:
        for tech in techniques:
            print(f"  • {tech.id}. {tech.name} ({tech.style})")
        if Technique.query.count() > 5:
            print(f"  ... and {Technique.query.count() - 5} more")
    else:
        print("  ⚠️  No techniques found!")
        print("  💡 Run: python seed.py")
    
    print("\n" + "="*50)
    print("✅ Database check complete!")
    print("="*50 + "\n")