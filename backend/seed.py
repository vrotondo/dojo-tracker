from app import create_app
from app.models import db
from app.models.technique import Technique
from app.models.user import User
from app.models.analysis import VideoAnalysis

app = create_app()

with app.app_context():
    # Check if techniques already exist
    if Technique.query.count() > 0:
        print("⚠️  Techniques already exist in database. Skipping seed.")
    else:
        # Sample techniques to get you started
        techniques = [
            {
                'name': 'Front Kick (Mae Geri)',
                'description': 'A fundamental forward kick executed with the ball of the foot, targeting the opponent\'s midsection.',
                'style': 'Karate',
                'difficulty': 'Beginner',
                'reference_video_url': 'https://www.youtube.com/watch?v=example1'
            },
            {
                'name': 'Roundhouse Kick (Mawashi Geri)',
                'description': 'A circular kick that strikes with the instep or shin, one of the most powerful kicks in martial arts.',
                'style': 'Karate',
                'difficulty': 'Intermediate',
                'reference_video_url': 'https://www.youtube.com/watch?v=example2'
            },
            {
                'name': 'Jab-Cross Combination',
                'description': 'Basic boxing combination: lead hand jab followed by rear hand cross punch.',
                'style': 'Boxing',
                'difficulty': 'Beginner',
                'reference_video_url': 'https://www.youtube.com/watch?v=example3'
            },
            {
                'name': 'Triangle Choke (Sankaku Jime)',
                'description': 'A submission technique that uses the legs to apply pressure to the opponent\'s neck and shoulder.',
                'style': 'Brazilian Jiu-Jitsu',
                'difficulty': 'Advanced',
                'reference_video_url': 'https://www.youtube.com/watch?v=example4'
            },
            {
                'name': 'Spinning Back Kick',
                'description': 'A powerful kick executed while spinning 360 degrees, striking with the heel.',
                'style': 'Taekwondo',
                'difficulty': 'Advanced',
                'reference_video_url': 'https://www.youtube.com/watch?v=example5'
            },
            {
                'name': 'Side Kick (Yoko Geri)',
                'description': 'A lateral kick delivered with the edge of the foot, used for keeping distance and generating power.',
                'style': 'Karate',
                'difficulty': 'Intermediate',
                'reference_video_url': 'https://www.youtube.com/watch?v=example6'
            },
            {
                'name': 'Hip Throw (O Goshi)',
                'description': 'A fundamental judo throw that uses hip rotation to off-balance and throw the opponent.',
                'style': 'Judo',
                'difficulty': 'Intermediate',
                'reference_video_url': 'https://www.youtube.com/watch?v=example7'
            },
            {
                'name': 'Flying Knee',
                'description': 'An explosive jumping knee strike aimed at the opponent\'s head or body.',
                'style': 'Muay Thai',
                'difficulty': 'Advanced',
                'reference_video_url': 'https://www.youtube.com/watch?v=example8'
            }
        ]
        
        # Add techniques to database
        for tech_data in techniques:
            technique = Technique(**tech_data)
            db.session.add(technique)
        
        db.session.commit()
        print(f"✅ Successfully seeded {len(techniques)} techniques!")
        
        # Display what was added
        print("\n📋 Techniques added:")
        for tech in Technique.query.all():
            print(f"  • {tech.name} ({tech.style}) - {tech.difficulty}")