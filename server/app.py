from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import mysql.connector
import os
import json
from datetime import datetime
import hashlib

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'king18',  # Set your MySQL password here
    'database': 'screen_time_tracker'
}

# Create database connection
def get_db_connection():
    try:
        # First try to connect to MySQL server
        conn = mysql.connector.connect(
            host=db_config['host'],
            user=db_config['user'],
            password=db_config['password']
        )
        
        # Check if database exists, create if it doesn't
        cursor = conn.cursor()
        cursor.execute("SHOW DATABASES LIKE 'screen_time_tracker'")
        result = cursor.fetchone()
        
        if not result:
            # Create database and tables
            print("Creating database...")
            with open('create_database.sql', 'r') as f:
                sql_script = f.read()
                
            # Split the script into individual statements
            statements = sql_script.split(';')
            for statement in statements:
                if statement.strip():
                    cursor.execute(statement)
            
            conn.commit()
            print("Database created successfully")
        
        # Connect to the database
        conn.close()
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

# Initialize database
def init_db():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create website_limits table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS website_limits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                website_url VARCHAR(255) NOT NULL,
                time_limit INT NOT NULL,
                time_used INT DEFAULT 0,
                last_reset DATE NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE KEY user_website (user_id, website_url)
            )
        ''')
        
        conn.commit()
        cursor.close()
        conn.close()
        print("Database initialized successfully")
    else:
        print("Failed to initialize database")

# Initialize database on startup
init_db()

# API Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    # Hash the password
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                (username, email, password_hash)
            )
            conn.commit()
            user_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return jsonify({'success': True, 'user_id': user_id}), 201
        except mysql.connector.Error as err:
            return jsonify({'success': False, 'message': str(err)}), 400
    else:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Missing email or password'}), 400
    
    # Hash the password
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, username, email FROM users WHERE email = %s AND password_hash = %s",
            (email, password_hash)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user:
            return jsonify({'success': True, 'user': user}), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    else:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, email, created_at FROM users")
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'users': users}), 200
    else:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500

@app.route('/api/websites', methods=['GET'])
def get_websites():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM website_limits WHERE user_id = %s",
            (user_id,)
        )
        websites = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Check if any websites need to be reset
        today = datetime.now().date()
        for website in websites:
            last_reset = website['last_reset']
            if last_reset < today:
                update_website_reset(user_id, website['website_url'], today)
                website['time_used'] = 0
                website['last_reset'] = today.isoformat()
        
        return jsonify({'success': True, 'websites': websites}), 200
    else:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500

@app.route('/api/websites', methods=['POST'])
def add_website():
    data = request.json
    user_id = data.get('user_id')
    website_url = data.get('website_url')
    time_limit = data.get('time_limit')
    
    if not user_id or not website_url or not time_limit:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO website_limits (user_id, website_url, time_limit, last_reset) VALUES (%s, %s, %s, %s)",
                (user_id, website_url, time_limit, datetime.now().date())
            )
            conn.commit()
            website_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return jsonify({'success': True, 'website_id': website_id}), 201
        except mysql.connector.Error as err:
            return jsonify({'success': False, 'message': str(err)}), 400
    else:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500

@app.route('/api/websites/<int:website_id>', methods=['DELETE'])
def delete_website(website_id):
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM website_limits WHERE id = %s AND user_id = %s",
            (website_id, user_id)
        )
        conn.commit()
        deleted = cursor.rowcount > 0
        cursor.close()
        conn.close()
        
        if deleted:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'success': False, 'message': 'Website not found or not owned by user'}), 404
    else:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500

@app.route('/api/websites/update-time', methods=['POST'])
def update_website_time():
    data = request.json
    user_id = data.get('user_id')
    website_url = data.get('website_url')
    time_used = data.get('time_used')
    
    if not user_id or not website_url or time_used is None:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE website_limits SET time_used = %s WHERE user_id = %s AND website_url = %s",
            (time_used, user_id, website_url)
        )
        conn.commit()
        updated = cursor.rowcount > 0
        cursor.close()
        conn.close()
        
        if updated:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'success': False, 'message': 'Website not found or not owned by user'}), 404
    else:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500

def update_website_reset(user_id, website_url, reset_date):
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE website_limits SET time_used = 0, last_reset = %s WHERE user_id = %s AND website_url = %s",
            (reset_date, user_id, website_url)
        )
        conn.commit()
        cursor.close()
        conn.close()

@app.route('/')
def index():
    return jsonify({'message': 'Screen Time Tracker API is running'}), 200

@app.route('/api/db-status', methods=['GET'])
def db_status():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        
        # Get user count
        cursor.execute("SELECT COUNT(*) as user_count FROM users")
        user_count = cursor.fetchone()['user_count']
        
        # Get website count
        cursor.execute("SELECT COUNT(*) as website_count FROM website_limits")
        website_count = cursor.fetchone()['website_count']
        
        # Get all users with their website counts
        cursor.execute("""
            SELECT u.id, u.username, u.email, COUNT(w.id) as website_count 
            FROM users u
            LEFT JOIN website_limits w ON u.id = w.user_id
            GROUP BY u.id
        """)
        user_stats = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'connected',
            'users': user_count,
            'websites': website_count,
            'user_stats': user_stats
        }), 200
    else:
        return jsonify({'status': 'disconnected'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)