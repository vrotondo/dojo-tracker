"""
Import Techniques Script
Scrapes BlackBeltWiki and imports techniques into database
"""

import sys
import os
import json

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.technique import Technique
from scrape_blackbeltwiki import BlackBeltWikiScraper


def clean_technique_data(technique):
    """Clean and validate technique data"""
    return {
        'name': technique.get('name', 'Unknown')[:100],  # Limit to 100 chars
        'description': technique.get('description', '')[:1000],  # Limit to 1000 chars
        'style': technique.get('style', 'General')[:50],
        'difficulty': technique.get('difficulty', 'Intermediate')[:20],
        'category': technique.get('category', 'Techniques')[:50],
        'reference_video_url': technique.get('reference_video_url', None)
    }


def technique_exists(name, style):
    """Check if technique already exists in database"""
    return Technique.query.filter_by(name=name, style=style).first() is not None


def import_from_json(json_file):
    """Import techniques from a JSON file"""
    print(f"\n📂 Loading techniques from {json_file}")
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            techniques = json.load(f)
    except FileNotFoundError:
        print(f"❌ File not found: {json_file}")
        return 0
    except json.JSONDecodeError:
        print(f"❌ Invalid JSON file: {json_file}")
        return 0
    
    return import_techniques(techniques)


def import_techniques(techniques):
    """Import techniques into database"""
    print(f"\n🚀 Starting import of {len(techniques)} techniques...")
    
    imported = 0
    skipped = 0
    errors = 0
    
    for i, tech_data in enumerate(techniques, 1):
        try:
            # Clean the data
            clean_data = clean_technique_data(tech_data)
            
            # Check if already exists
            if technique_exists(clean_data['name'], clean_data['style']):
                print(f"⏭️  Skipped (exists): {clean_data['name']}")
                skipped += 1
                continue
            
            # Create new technique
            technique = Technique(
                name=clean_data['name'],
                description=clean_data['description'],
                style=clean_data['style'],
                difficulty=clean_data['difficulty'],
                reference_video_url=clean_data['reference_video_url']
            )
            
            db.session.add(technique)
            imported += 1
            
            # Commit every 50 techniques
            if imported % 50 == 0:
                db.session.commit()
                print(f"💾 Committed {imported} techniques")
        
        except Exception as e:
            print(f"❌ Error importing {tech_data.get('name', 'Unknown')}: {e}")
            errors += 1
            db.session.rollback()
            continue
    
    # Final commit
    try:
        db.session.commit()
        print(f"\n✅ Final commit successful")
    except Exception as e:
        print(f"❌ Final commit failed: {e}")
        db.session.rollback()
    
    # Summary
    print(f"\n" + "="*50)
    print(f"📊 IMPORT SUMMARY")
    print(f"="*50)
    print(f"✅ Imported: {imported}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"❌ Errors: {errors}")
    print(f"📚 Total in DB: {Technique.query.count()}")
    print(f"="*50 + "\n")
    
    return imported


def scrape_and_import():
    """Scrape BlackBeltWiki and import directly"""
    print("\n🕷️  Starting web scraping...")
    
    scraper = BlackBeltWikiScraper()
    techniques = scraper.scrape_all()
    
    if not techniques:
        print("❌ No techniques scraped")
        return 0
    
    # Save to JSON for backup
    scraper.save_to_json('techniques_scraped.json')
    
    # Import to database
    return import_techniques(techniques)


def main():
    """Main import function"""
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*50)
        print("🥋 DOJOTRACKER - TECHNIQUE IMPORTER")
        print("="*50)
        
        # Check current database status
        current_count = Technique.query.count()
        print(f"\n📊 Current techniques in database: {current_count}")
        
        # Ask user what to do
        print("\nOptions:")
        print("1. Scrape BlackBeltWiki and import")
        print("2. Import from existing JSON file")
        print("3. Cancel")
        
        choice = input("\nEnter choice (1-3): ").strip()
        
        if choice == '1':
            imported = scrape_and_import()
        elif choice == '2':
            json_file = input("Enter JSON filename (default: techniques_scraped.json): ").strip()
            if not json_file:
                json_file = 'techniques_scraped.json'
            imported = import_from_json(json_file)
        else:
            print("❌ Cancelled")
            return
        
        if imported > 0:
            print(f"\n🎉 Successfully imported {imported} new techniques!")
            print(f"📚 Total techniques now: {Technique.query.count()}")
        else:
            print("\n⚠️  No new techniques imported")


if __name__ == '__main__':
    main()