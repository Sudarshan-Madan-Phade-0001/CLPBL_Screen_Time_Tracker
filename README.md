# CLPBL_Screen_Time_Tracker
Screen Time Tracker is a desktop-focused web application designed to help users stay productive by limiting their access to distracting websites. Users can manually set time limits for specific websites, and once the limit is reached, the site will be automatically blocked via a connected Chrome extension.


# 🖥️ Screen Time Tracker

**Screen Time Tracker** is a desktop-focused web application designed to help users stay productive by limiting their time on distracting websites. It combines a clean web interface, a powerful Chrome extension, a Flask backend, and a Python visualization tool to deliver complete control over your screen usage.

---

## 🔧 Key Features

- ⏱️ Set custom time limits for distracting websites
- 🔌 Chrome extension to track & block sites once limits are reached
- 🧠 User authentication and limit storage using Flask + MySQL backend
- 📊 Visual analytics: View website usage heatmaps using Python
- 🔄 Time limits reset automatically every day

---

## 🧩 Project Modules

### 1. 🔒 Web Application
- Built with HTML, CSS, and JavaScript
- Allows users to:
  - Register/login
  - Add websites and set time limits
  - Export data for visualization

### 2. 🚫 Chrome Extension
- Monitors browser activity and blocks websites after limit is exceeded
- Displays remaining time in popup UI
- Automatically redirects to a "blocked" page
- Syncs with the web backend to fetch/update usage data

### 3. 🔥 Backend Server (Flask)
- Handles user registration/login
- Stores time limits and usage data in MySQL
- Provides REST API endpoints for extension/webapp communication

### 4. 📈 Usage Stats Visualizer (Python)
- Generates a heatmap from exported usage data (`website_data.json`)
- Helps users see which sites are taking most of their time

---

## 🚀 Getting Started

### ✅ Web App & Extension

1. **Clone the repo**
2. Navigate to `chrome://extensions/` in Chrome
3. Enable **Developer Mode**
4. Click **Load Unpacked** → Select the `extension/` folder
5. Set your extension ID in:
   - `website-blocker.js`
   - `js/auth.js`
   - `js/website-tracker-api.js`

---

### ✅ Backend Setup

1. Install MySQL and create the database:
   ```bash
   mysql -u root -p < setup_db.sql

2. Install required Python packages:
   pip install -r requirements.txt

3. Configure DB in app.py:
   db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'king18',
    'database': 'screen_time_tracker'
}

4. Run the backend:
   python app.py

--------------------------------------------------------------------------------------------------------------------------------------------------------------------
✅ Heatmap Visualization
1. Export data from the webapp (website_blocker.html)
2. Save it as website_data.json in the same folder as usage_stats.py

3. Run (terminal):
   python usage_stats.py

4. View website_usage_heatmap.png to analyze your usage
--------------------------------------------------------------------------------------------------------------------------------------------------------------------

REQUIREMENTS
PYTHON PACKAGES
# For Flask backend
flask==2.0.1
flask-cors==3.0.10
mysql-connector-python==8.0.26

# For usage stats visualizer
pandas==1.5.3
matplotlib==3.7.1
seaborn==0.12.2
numpy==1.24.3
--------------------------------------------------------------------------------------------------------------------------------------------------------------------

📌 Notes
Currently optimized for desktop Chrome usage only

The system stores and enforces limits locally or via backend (based on mode)

Icons (icon16, icon48, icon128) should be placed in the /icons folder
