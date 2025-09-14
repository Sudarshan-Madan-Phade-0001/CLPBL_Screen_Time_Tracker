// API module for website tracking functionality

const API_URL = 'https://clpbl-screen-time-tracker.onrender.com/api';

// Get all websites for the current user
async function getWebsites() {
  const user = window.auth.getCurrentUser();
  if (!user) {
    return { success: false, message: "User not logged in" };
  }
  
  try {
    const response = await fetch(`${API_URL}/websites?user_id=${user.id}`);
    const data = await response.json();
    
    if (data.success) {
      return { success: true, websites: data.websites };
    } else {
      return { success: false, message: data.message || "Failed to fetch websites" };
    }
  } catch (error) {
    console.error("Error fetching websites:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

// Add a new website
async function addWebsite(websiteUrl, timeLimit) {
  const user = window.auth.getCurrentUser();
  if (!user) {
    return { success: false, message: "User not logged in" };
  }
  
  try {
    const response = await fetch(`${API_URL}/websites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.id,
        website_url: websiteUrl,
        time_limit: timeLimit
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update extension with new website limit
      notifyExtensionWebsiteUpdate();
      return { success: true, websiteId: data.website_id };
    } else {
      return { success: false, message: data.message || "Failed to add website" };
    }
  } catch (error) {
    console.error("Error adding website:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

// Delete a website
async function deleteWebsite(websiteId) {
  const user = window.auth.getCurrentUser();
  if (!user) {
    return { success: false, message: "User not logged in" };
  }
  
  try {
    const response = await fetch(`${API_URL}/websites/${websiteId}?user_id=${user.id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update extension with website removal
      notifyExtensionWebsiteUpdate();
      return { success: true };
    } else {
      return { success: false, message: data.message || "Failed to delete website" };
    }
  } catch (error) {
    console.error("Error deleting website:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

// Update website time usage
async function updateWebsiteTime(websiteUrl, timeUsed) {
  const user = window.auth.getCurrentUser();
  if (!user) {
    return { success: false, message: "User not logged in" };
  }
  
  try {
    const response = await fetch(`${API_URL}/websites/update-time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.id,
        website_url: websiteUrl,
        time_used: timeUsed
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true };
    } else {
      return { success: false, message: data.message || "Failed to update website time" };
    }
  } catch (error) {
    console.error("Error updating website time:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

// Notify Chrome extension about website updates
function notifyExtensionWebsiteUpdate() {
  try {
    const EXTENSION_ID = "bgkdgfajihbgpebdmmkggkjakiefnmmj";
    
    chrome.runtime.sendMessage(EXTENSION_ID, {
      action: "refreshData"
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.log("Extension communication error:", chrome.runtime.lastError.message);
      } else if (response && response.success) {
        console.log("Extension data refreshed");
      }
    });
  } catch (e) {
    console.log("Extension not available:", e);
  }
}

// Export functions
window.websiteApi = {
  getWebsites,
  addWebsite,
  deleteWebsite,
  updateWebsiteTime,
  notifyExtensionWebsiteUpdate
};