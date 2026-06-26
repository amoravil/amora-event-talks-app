# BigQuery Release Notes Explorer & Tweeter

A premium, glassmorphic web application built with a **Python Flask** backend and a **Vanilla HTML5, CSS3, and JavaScript** frontend. It fetches, parses, filters, and shares BigQuery release notes instantly.

## 🚀 Application URL
- **Local Dev Server:** [http://127.0.0.1:5001](http://127.0.0.1:5001)

## 📁 Project Structure
The project is located at `/Users/andrea/ai/agy-cli-projects/bigquery-release-viewer` and consists of the following components:

- [app.py](file:///Users/andrea/ai/agy-cli-projects/bigquery-release-viewer/app.py): Flask backend hosting the API endpoints and parsing the Atom XML feed.
- [templates/index.html](file:///Users/andrea/ai/agy-cli-projects/bigquery-release-viewer/templates/index.html): HTML page with structural content layout, search components, stats, and composer.
- [static/css/style.css](file:///Users/andrea/ai/agy-cli-projects/bigquery-release-viewer/static/css/style.css): Vanilla CSS styling incorporating custom HSL variables, glassmorphic cards, glowing background blobs, custom badges, and responsive layouts.
- [static/js/app.js](file:///Users/andrea/ai/agy-cli-projects/bigquery-release-viewer/static/js/app.js): Core interactive logic including AJAX feed fetches, date group layouts, keyword searches, category pill filters, and character counters.
- [requirements.txt](file:///Users/andrea/ai/agy-cli-projects/bigquery-release-viewer/requirements.txt): Environment dependencies.

---

## 🛠️ Architecture & Key Features

### 1. Feed Aggregator & Parser (`app.py`)
- Fetches Google's live XML feed from: `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`.
- Uses `xml.etree.ElementTree` to parse the Atom structure.
- Splits each day's entry into **individual specific updates** by identifying `<h3>` header markers in the HTML payload. This lets users select and share specific features, changes, announcements, or breaking updates.
- Normalizes and strips HTML tags using regex to produce clean text for tweets.
- Dynamically generates draft tweet templates with a character-count budget that automatically accounts for Twitter's 23-character `t.co` URL wrapping.

### 2. Premium Design System (`style.css`)
- **Theme:** Ultra-modern dark mode (`#0a0f1d`) with glowing deep blue, purple, and cyan decorative radial orbs.
- **Glassmorphism:** Card containers employ a blur backdrop filter (`backdrop-filter: blur(16px)`) with semi-transparent dark gray fills and thin translucent borders.
- **Responsive Layout:** Automatically scales from a 2-column split (Feed | Composer) on desktop to a stacked mobile view with a sticky bottom composer drawer.
- **Vibrant Badges:** Custom-themed gradient labels for:
  - <span style="color:#10b981; font-weight:bold;">Feature</span> (Green / Emerald glow)
  - <span style="color:#3b82f6; font-weight:bold;">Change</span> (Blue glow)
  - <span style="color:#ef4444; font-weight:bold;">Breaking / Issue</span> (Crimson glow)
  - <span style="color:#a78bfa; font-weight:bold;">Announcement</span> (Purple / Violet glow)

### 3. Tweet Composer & Interactive UI (`app.js`)
- **Interactive Stats Panel:** Shows counts for total, feature, change, and breaking updates currently loaded in the UI.
- **Dynamic Search & Filters:** Instantly filters feed updates by typing keyword phrases or toggling category pills (All, Features, Changes, etc.).
- **Live Text Editing & Revert:** Users can select any update to populate the tweet editor. They can customize the draft text and hit "Revert" to reset to the original feed draft.
- **Twitter-Specific Char Counter:** Counts down from 280 characters. Uses a circular progress ring that shifts from Cyan $\rightarrow$ Amber $\rightarrow$ Red as characters get depleted, accounting for URL shortening limits.
- **Post to X Link:** Renders a clickable Twitter web intent link that populates the Twitter text field.

---

## 🏃 Running the Application

The application is already running in the background as task `task-30`. If you ever need to start it manually, follow these instructions:

```bash
cd /Users/andrea/ai/agy-cli-projects/bigquery-release-viewer
source venv/bin/activate
python app.py
```
Then navigate to [http://127.0.0.1:5001](http://127.0.0.1:5001) in your browser.
