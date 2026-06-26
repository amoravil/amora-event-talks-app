import re
import urllib.parse
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request
import requests

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}

def strip_html(html_str):
    """Strip HTML tags and normalize whitespace and entities for text/tweets."""
    # Replace some common block elements with spaces to prevent words from running together
    text = re.sub(r'</?(p|li|h[1-6]|div|br|ul|ol)[^>]*>', ' ', html_str)
    # Strip remaining HTML tags
    text = re.sub(r'<[^<]+?>', '', text)
    # Clean up HTML entities
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&amp;', '&')
    text = text.replace('&quot;', '"')
    text = text.replace('&#39;', "'")
    text = text.replace('&rsquo;', "'")
    text = text.replace('&lsquo;', "'")
    text = text.replace('&ldquo;', '"')
    text = text.replace('&rdquo;', '"')
    text = text.replace('&ndash;', '-')
    text = text.replace('&mdash;', '-')
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def generate_tweet_text(update_type, date_str, clean_text, link):
    """Generate a tweet draft limited to 280 characters."""
    prefix = f"BigQuery {update_type} ({date_str}): "
    # Twitter counts any URL as 23 characters (t.co)
    url_len = 23
    # 280 - prefix - URL - 1 space
    available_len = 280 - len(prefix) - url_len - 1
    
    if len(clean_text) > available_len:
        snippet = clean_text[:available_len - 3].strip() + "..."
    else:
        snippet = clean_text
        
    return f"{prefix}{snippet} {link}"

def parse_feed_xml(xml_content):
    """Parse the Atom XML feed content and extract release updates."""
    root = ET.fromstring(xml_content)
    entries = []
    
    for entry in root.findall('atom:entry', ATOM_NS):
        # Date of the entry
        date_title = entry.find('atom:title', ATOM_NS)
        date_str = date_title.text.strip() if date_title is not None else "Unknown Date"
        
        # Link for the entry
        link_elem = entry.find("atom:link[@rel='alternate']", ATOM_NS)
        if link_elem is None:
            link_elem = entry.find("atom:link", ATOM_NS)
        
        link = ""
        if link_elem is not None:
            link = link_elem.attrib.get('href', '')
            
        # Entry ID
        entry_id = entry.find('atom:id', ATOM_NS)
        id_str = entry_id.text.strip() if entry_id is not None else ""
        
        # Content (HTML)
        content_elem = entry.find('atom:content', ATOM_NS)
        if content_elem is None or content_elem.text is None:
            continue
            
        html_content = content_elem.text.strip()
        
        # Split html_content by <h3> to extract individual updates
        parts = re.split(r'<h3>', html_content)
        
        update_index = 0
        for part in parts:
            if not part.strip():
                continue
                
            subparts = part.split('</h3>', 1)
            if len(subparts) == 2:
                update_type = subparts[0].strip()
                update_html = subparts[1].strip()
            else:
                update_type = "Update"
                update_html = part.strip()
                
            clean_text = strip_html(update_html)
            tweet_text = generate_tweet_text(update_type, date_str, clean_text, link)
            
            # Create a unique ID for each update sub-item
            item_id = f"{id_str}_update_{update_index}"
            
            entries.append({
                "id": item_id,
                "date": date_str,
                "type": update_type,
                "html": update_html,
                "clean_text": clean_text,
                "tweet_text": tweet_text,
                "link": link
            })
            update_index += 1
            
    return entries

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        updates = parse_feed_xml(response.content)
        return jsonify({
            "status": "success",
            "count": len(updates),
            "updates": updates
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
