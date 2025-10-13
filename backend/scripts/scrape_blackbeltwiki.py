"""
BlackBeltWiki Technique Scraper
Scrapes martial arts techniques from BlackBeltWiki
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin
import re

class BlackBeltWikiScraper:
    def __init__(self):
        self.base_url = "https://www.blackbeltwiki.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.techniques = []
    
    def scrape_technique_list(self, url):
        """Scrape a list page of techniques"""
        try:
            print(f"📄 Scraping list: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the main content area - technique links are usually in lists or content divs
            content = soup.find('div', class_='entry-content') or soup.find('article') or soup
            
            # Find all links in the content
            links = content.find_all('a', href=True)
            
            for link in links:
                href = link.get('href')
                text = link.get_text(strip=True)
                
                # Skip empty text or very short
                if not text or len(text) < 3:
                    continue
                
                # Skip obvious non-technique links (in text, not href)
                skip_text_keywords = ['click here', 'read more', 'see also', 'main article',
                                     'category:', 'home', 'back to', 'return to']
                if any(keyword in text.lower() for keyword in skip_text_keywords):
                    continue
                
                # Must be an internal link
                if not href.startswith('/') and 'blackbeltwiki.com' not in href:
                    continue
                
                # Convert to full URL
                full_url = urljoin(self.base_url, href)
                
                # Skip navigation/system pages in URL
                skip_url_keywords = ['wp-content', 'wp-admin', 'wp-includes', 
                                    'feed', 'rss', 'xmlrpc', 'wp-json',
                                    'author', 'tag', 'category', 'page',
                                    'search', 'login', 'register']
                if any(keyword in href.lower() for keyword in skip_url_keywords):
                    continue
                
                # Skip the main category pages themselves
                category_pages = ['/kicks', '/punches', '/blocks', '/grappling', '/joint-locks',
                                 '/karate-kicks', '/karate-techniques', '/taekwondo-kicks',
                                 '/taekwondo-techniques', '/muay-thai-kicks', '/boxing-techniques',
                                 '/mixed-martial-arts', '/judo', '/jiu-jitsu',
                                 '/home', '/about', '/contact', '/privacy', '/terms']
                
                # Only skip if it's EXACTLY these pages
                if href.rstrip('/') in category_pages:
                    continue
                
                # If we got here, it's probably a technique page
                # Technique pages are typically: /technique-name (one level deep)
                if href.startswith('/') and href.count('/') >= 1:
                    yield {'name': text, 'url': full_url}
            
            time.sleep(1)  # Be polite to the server
            
        except Exception as e:
            print(f"❌ Error scraping {url}: {e}")
    
    def scrape_technique_detail(self, technique_url):
        """Scrape detailed information for a single technique"""
        try:
            response = self.session.get(technique_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract technique data
            technique_data = {
                'name': self.extract_name(soup),
                'description': self.extract_description(soup),
                'style': self.extract_style(soup),
                'difficulty': self.extract_difficulty(soup),
                'category': self.extract_category(technique_url),
                'reference_video_url': self.extract_video_url(soup)
            }
            
            time.sleep(0.5)  # Be polite
            return technique_data
            
        except Exception as e:
            print(f"Error scraping detail {technique_url}: {e}")
            return None
    
    def extract_name(self, soup):
        """Extract technique name"""
        # Try h1 first, then title
        h1 = soup.find('h1')
        if h1:
            return h1.get_text(strip=True)
        
        title = soup.find('title')
        if title:
            return title.get_text(strip=True).split('|')[0].strip()
        
        return "Unknown Technique"
    
    def extract_description(self, soup):
        """Extract technique description"""
        # Look for the first paragraph after h1
        content = soup.find('div', class_='content') or soup.find('div', class_='entry-content')
        
        if content:
            paragraphs = content.find_all('p')
            if paragraphs:
                # Get first few paragraphs
                desc = ' '.join([p.get_text(strip=True) for p in paragraphs[:2]])
                return desc[:500]  # Limit to 500 chars
        
        # Fallback: get first p tag
        first_p = soup.find('p')
        if first_p:
            return first_p.get_text(strip=True)[:500]
        
        return "No description available"
    
    def extract_style(self, soup):
        """Extract martial arts style"""
        text = soup.get_text().lower()
        
        # Check for common styles
        styles = {
            'karate': ['karate', 'shotokan', 'kyokushin', 'goju-ryu'],
            'taekwondo': ['taekwondo', 'tae kwon do', 'tkd'],
            'kung fu': ['kung fu', 'wushu', 'shaolin'],
            'muay thai': ['muay thai', 'thai boxing'],
            'boxing': ['boxing', 'pugilism'],
            'judo': ['judo'],
            'jiu-jitsu': ['jiu-jitsu', 'jujutsu', 'bjj'],
            'mixed martial arts': ['mma', 'mixed martial'],
            'kickboxing': ['kickboxing'],
            'capoeira': ['capoeira']
        }
        
        for style, keywords in styles.items():
            for keyword in keywords:
                if keyword in text:
                    return style.title()
        
        return "General"
    
    def extract_difficulty(self, soup):
        """Extract difficulty level"""
        text = soup.get_text().lower()
        
        if any(word in text for word in ['advanced', 'expert', 'difficult', 'complex']):
            return "Advanced"
        elif any(word in text for word in ['intermediate', 'moderate']):
            return "Intermediate"
        elif any(word in text for word in ['beginner', 'basic', 'simple', 'easy']):
            return "Beginner"
        
        # Default to intermediate
        return "Intermediate"
    
    def extract_category(self, url):
        """Extract category from URL"""
        url_lower = url.lower()
        
        if 'kick' in url_lower:
            return "Kicks"
        elif 'punch' in url_lower or 'strike' in url_lower:
            return "Strikes"
        elif 'block' in url_lower or 'defense' in url_lower:
            return "Blocks"
        elif 'throw' in url_lower or 'takedown' in url_lower:
            return "Throws"
        elif 'grappling' in url_lower or 'submission' in url_lower:
            return "Grappling"
        elif 'kata' in url_lower or 'form' in url_lower:
            return "Forms"
        
        return "Techniques"
    
    def extract_video_url(self, soup):
        """Extract YouTube video URL if present"""
        # Look for YouTube embeds or links
        iframe = soup.find('iframe', src=re.compile(r'youtube\.com'))
        if iframe:
            return iframe['src']
        
        youtube_link = soup.find('a', href=re.compile(r'youtube\.com|youtu\.be'))
        if youtube_link:
            return youtube_link['href']
        
        return None
    
    def scrape_all(self):
        """Main scraping method"""
        print("🕷️  Starting BlackBeltWiki scraper...")
        
        # List of category pages to scrape (CORRECTED URLS)
        category_pages = [
            # Main technique pages
            f"{self.base_url}/kicks",
            f"{self.base_url}/punches",
            f"{self.base_url}/blocks",
            f"{self.base_url}/grappling",
            f"{self.base_url}/joint-locks",
            
            # Style-specific pages
            f"{self.base_url}/karate-kicks",
            f"{self.base_url}/karate-techniques",
            f"{self.base_url}/taekwondo-kicks",
            f"{self.base_url}/taekwondo-techniques",
            f"{self.base_url}/muay-thai-kicks",
            f"{self.base_url}/boxing-techniques",
            f"{self.base_url}/mixed-martial-arts",
            f"{self.base_url}/judo",
            f"{self.base_url}/jiu-jitsu",
        ]
        
        # Collect all technique URLs
        technique_urls = set()
        
        for i, page_url in enumerate(category_pages, 1):
            print(f"\n[{i}/{len(category_pages)}] Processing: {page_url}")
            try:
                found_count = 0
                for technique in self.scrape_technique_list(page_url):
                    technique_urls.add((technique['name'], technique['url']))
                    found_count += 1
                print(f"   ✅ Found {found_count} techniques")
            except Exception as e:
                print(f"   ❌ Error: {e}")
                continue
        
        print(f"\n📊 Found {len(technique_urls)} unique techniques across all pages")
        
        if len(technique_urls) == 0:
            print("\n⚠️  No techniques found. The site structure may have changed.")
            print("💡 Tip: Check if BlackBeltWiki is accessible at https://blackbeltwiki.com")
            return []
        
        # Scrape details for each technique
        scraped_count = 0
        errors_count = 0
        
        print(f"\n🔍 Scraping technique details...")
        for name, url in technique_urls:
            print(f"[{scraped_count + 1}/{len(technique_urls)}] {name}")
            detail = self.scrape_technique_detail(url)
            
            if detail:
                self.techniques.append(detail)
                scraped_count += 1
            else:
                errors_count += 1
            
            # Progress update every 25 techniques
            if (scraped_count + errors_count) % 25 == 0:
                print(f"   📈 Progress: {scraped_count} succeeded, {errors_count} failed")
        
        print(f"\n✅ Scraping complete!")
        print(f"   Success: {len(self.techniques)} techniques")
        print(f"   Failed: {errors_count} techniques")
        return self.techniques
    
    def save_to_json(self, filename='techniques_scraped.json'):
        """Save scraped techniques to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.techniques, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved to {filename}")


def main():
    scraper = BlackBeltWikiScraper()
    techniques = scraper.scrape_all()
    scraper.save_to_json('techniques_scraped.json')
    
    print(f"\n📊 Summary:")
    print(f"Total techniques: {len(techniques)}")
    
    # Count by style
    styles = {}
    for tech in techniques:
        style = tech.get('style', 'Unknown')
        styles[style] = styles.get(style, 0) + 1
    
    print("\nBy Style:")
    for style, count in sorted(styles.items(), key=lambda x: x[1], reverse=True):
        print(f"  {style}: {count}")


if __name__ == '__main__':
    main()