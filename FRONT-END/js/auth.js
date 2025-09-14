// Authentication module for Screen Time Tracker

const AUTH_KEY = 'screen_time_tracker_auth';
const API_URL = 'https://clpbl-screen-time-tracker.onrender.com/api';

// Store the current user
let currentUser = null;

// Initialize authentication state
function initAuth() {
  const storedAuth = localStorage.getItem(AUTH_KEY);
  if (storedAuth) {
    try {
      currentUser = JSON.parse(storedAuth);
      console.log("User authenticated:", currentUser.username);
      
      // Notify extension about login
      notifyExtensionLogin(currentUser.id);
      
      return true;
    } catch (e) {
      console.error("Error parsing auth data:", e);
      localStorage.removeItem(AUTH_KEY);
    }
  }
  return false;
}

// Register a new user
async function registerUser(username, email, password) {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, userId: data.user_id };
    } else {
      return { success: false, message: data.message || "Registration failed" };
    }
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store user data
      currentUser = data.user;
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
      
      // Notify extension about login
      notifyExtensionLogin(currentUser.id);
      
      return { success: true, user: currentUser };
    } else {
      return { success: false, message: data.message || "Login failed" };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

// Logout user
function logoutUser() {
  currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  
  // Notify extension about logout
  notifyExtensionLogout();
  
  return true;
}

// Get current user
function getCurrentUser() {
  return currentUser;
}

// Check if user is logged in
function isLoggedIn() {
  return currentUser !== null;
}

// Notify Chrome extension about login
function notifyExtensionLogin(userId) {
  try {
    // The extension ID will need to be updated with the actual ID after installation
    const EXTENSION_ID = "bgkdgfajihbgpebdmmkggkjakiefnmmj";
    
    chrome.runtime.sendMessage(EXTENSION_ID, {
      action: "login",
      userId: userId
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.log("Extension communication error:", chrome.runtime.lastError.message);
      } else if (response && response.success) {
        console.log("Extension notified about login");
      }
    });
  } catch (e) {
    // Extension not available or not installed
    console.log("Extension not available:", e);
  }
}

// Notify Chrome extension about logout
function notifyExtensionLogout() {
  try {
    // The extension ID will need to be updated with the actual ID after installation
    const EXTENSION_ID = "bgkdgfajihbgpebdmmkggkjakiefnmmj";
    
    chrome.runtime.sendMessage(EXTENSION_ID, {
      action: "logout"
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.log("Extension communication error:", chrome.runtime.lastError.message);
      } else if (response && response.success) {
        console.log("Extension notified about logout");
      }
    });
  } catch (e) {
    // Extension not available or not installed
    console.log("Extension not available:", e);
  }
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', initAuth);

// Export functions
window.auth = {
  register: registerUser,
  login: loginUser,
  logout: logoutUser,
  getCurrentUser,
  isLoggedIn
};