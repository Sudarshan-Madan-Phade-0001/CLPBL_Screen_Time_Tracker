# Screen Time Tracker Backend Server

This is the backend server for the Screen Time Tracker application, which provides API endpoints for user authentication and website time limit management.

## Setup

1. Install MySQL and create a database:
   ```
   mysql -u root -p < setup_db.sql
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Configure the database connection in `app.py`:
   ```python
   db_config = {
       'host': 'localhost',
       'user': 'root',
       'password': 'your_password_here',  # Set your MySQL password here
       'database': 'screen_time_tracker'
   }
   ```

4. Run the server:
   ```
   python app.py
   ```

## API Endpoints

### Authentication

- `POST /api/register` - Register a new user
  - Request body: `{ "username": "user", "email": "user@example.com", "password": "password" }`
  - Response: `{ "success": true, "user_id": 1 }`

- `POST /api/login` - Login a user
  - Request body: `{ "email": "user@example.com", "password": "password" }`
  - Response: `{ "success": true, "user": { "id": 1, "username": "user", "email": "user@example.com" } }`

### Website Management

- `GET /api/websites?user_id=1` - Get all websites for a user
  - Response: `{ "success": true, "websites": [...] }`

- `POST /api/websites` - Add a new website
  - Request body: `{ "user_id": 1, "website_url": "example.com", "time_limit": 30 }`
  - Response: `{ "success": true, "website_id": 1 }`

- `DELETE /api/websites/1?user_id=1` - Delete a website
  - Response: `{ "success": true }`

- `POST /api/websites/update-time` - Update website time usage
  - Request body: `{ "user_id": 1, "website_url": "example.com", "time_used": 15 }`
  - Response: `{ "success": true }`

## Integration with Chrome Extension

The backend server communicates with the Chrome extension to synchronize website time limits and usage data. The extension will fetch the latest data from the server when the user logs in and will periodically update the server with time usage information.