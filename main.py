import sys
import os

# Change to server directory for database files
os.chdir(os.path.join(os.path.dirname(__file__), 'server'))
sys.path.append('.')

from app import app

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)