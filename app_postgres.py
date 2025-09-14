import psycopg2
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import hashlib

app = Flask(__name__)
CORS(app)

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as err:
        print(f"Database connection error: {err}")
        return None

# Rest of your routes stay the same...
@app.route('/')
def index():
    return jsonify({'message': 'Screen Time Tracker API is running'}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)