# Website Time Limiter Chrome Extension

This Chrome extension works with the Screen Time Tracker web application to block websites once the user exceeds their set time limit.

## Features

- Blocks websites based on time limits set in the Screen Time Tracker web app
- Tracks time spent on limited websites
- Shows remaining time in the extension popup
- Automatically resets time limits at midnight
- Redirects to a blocked page when time limit is exceeded
- Syncs with backend server for persistent time limits across devices

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" and select the `extension` folder
4. Note the extension ID that appears under the extension name
5. Update the `EXTENSION_ID` in the following files with your extension's ID:
   - `website-blocker.js`
   - `js/auth.js`
   - `js/website-tracker-api.js`

## How It Works

1. The web application allows users to set time limits for websites
2. When a user adds a website or updates time limits, the data is stored in the backend server
3. The extension communicates with the server to get the latest time limits
4. The extension tracks time spent on limited websites and blocks them when the limit is exceeded
5. Time limits reset at midnight each day

## Backend Integration

This extension works with a Flask backend server that provides:
- User authentication
- Website time limit storage
- Time usage synchronization across devices

Make sure the backend server is running before using the extension with the web app.

## Files

- `manifest.json`: Extension configuration
- `background.js`: Background script that tracks website usage and handles blocking
- `content.js`: Content script that runs on all web pages to check if they should be blocked
- `popup.html/js`: Extension popup UI showing website limits and remaining time
- `blocked.html`: Page shown when a website is blocked

## Note About Icons

This extension requires icon files in the `icons` folder:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)