-- Create the database
CREATE DATABASE IF NOT EXISTS screen_time_tracker;
USE screen_time_tracker;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create website_limits table
CREATE TABLE IF NOT EXISTS website_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    website_url VARCHAR(255) NOT NULL,
    time_limit INT NOT NULL,
    time_used INT DEFAULT 0,
    last_reset DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY user_website (user_id, website_url)
);