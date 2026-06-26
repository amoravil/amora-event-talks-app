# BigQuery Release Notes Explorer & Tweeter

A sleek, modern web application built with a **Python Flask** backend and a **Vanilla HTML5, CSS3, and JavaScript** frontend. The application aggregates Google BigQuery's official Atom release notes feed, divides it into granular updates, and features a smart composer panel that lets you compose and publish tweets about specific changes in one click.

---

## 🌟 Key Features

*   **Real-time Aggregation**: Connects to Google Cloud's official XML feed to pull up-to-date release notes.
*   **Granular Update Splits**: Rather than showing daily releases as one monolithic text block, the app splits updates by `<h3>` header categories (e.g., separating a *Feature* from a *Change* on the same date) so you can tweet about specific items.
*   **Premium Glassmorphic Design**: Built using a modern, dark-theme aesthetic (`#0a0f1d`) with vibrant glow accents, custom status badges, and subtle micro-animations.
*   **Smart Tweet Composer**: Auto-drafts tweets matching Twitter/X length rules. It features an interactive character countdown, circular progress indicator (Cyan ➔ Yellow ➔ Red), clipboard copying, and a "Revert" button.
*   **Interactive Search & Filter**: Instant client-side search and category filter pills (Features, Changes, Breaking Updates, etc.).
*   **Direct Sharing**: Clicking "Post on X" opens the official Twitter share intent populating the text area immediately.

---

## 🛠️ Technology Stack

*   **Backend**: Python Flask, Requests, XML ElementTree
*   **Frontend**: Plain HTML5, Vanilla CSS3 (Custom Properties & Backdrop Blur Filters), Vanilla ES6 JavaScript
*   **Typography**: Inter & Outfit (imported from Google Fonts)

---

## 📂 Project Structure

```text
├── app.py                  # Flask Web Server & Atom XML parser
├── requirements.txt        # Python dependency list
├── .gitignore              # Git ignore configuration
├── templates/
│   └── index.html          # HTML structure & layout
└── static/
    ├── css/
    │   └── style.css       # Layout grids, glassmorphism & gradients
    └── js/
        └── app.js          # State management, search, filters & composer logic
```

---

## 🚀 Local Setup & Installation

### Prerequisites
Make sure you have **Python 3.10+** and `pip` installed.

### 1. Clone the repository
Navigate to the directory:
```bash
cd bigquery-release-viewer
```

### 2. Set up a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the application
```bash
python app.py
```

The application will run locally at **[http://127.0.0.1:5001](http://127.0.0.1:5001)**.

---

## 🔄 How the Data Flows

1.  **Request**: The browser sends a request to the Flask server endpoint `/api/releases`.
2.  **Fetch**: Flask requests the XML feed from Google Cloud CDN.
3.  **Parse & Clean**: Flask parses the XML, splits the daily updates by `<h3>` categories, strips out the raw HTML tags for clean text, drafts the base tweet, and returns a JSON payload.
4.  **Render**: The client-side JS captures the JSON, updates stats counters, and maps the results to date-grouped cards.
5.  **Interactive Composer**: Selecting a card populates the composer textarea, calculates the length using Twitter's URL-shortening standards, and enables single-click sharing to Twitter/X.
