let websiteLimits = {};
let serverUrl = "https://clpbl-screen-time-tracker.onrender.com";
let currentUserId = null;
let activeTimers = {};

// Load data on startup
chrome.storage.local.get(['userId'], (data) => {
  if (data.userId) {
    currentUserId = data.userId;
    loadFromServer(data.userId);
  }
});

// Load website limits from server
async function loadFromServer(userId) {
  try {
    const response = await fetch(`${serverUrl}/api/websites?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success && data.websites) {
      websiteLimits = {};
      data.websites.forEach(website => {
        websiteLimits[website.website_url] = {
          timeLimit: website.time_limit * 60 * 1000,
          timeUsed: website.time_used * 60 * 1000,
          lastReset: website.last_reset
        };
      });
      console.log('Loaded limits:', websiteLimits);
    }
  } catch (error) {
    console.error('Failed to load from server:', error);
  }
}

// Check if site should be blocked
function shouldBlockSite(hostname) {
  for (const site in websiteLimits) {
    const cleanSite = site.replace('www.', '');
    const cleanHostname = hostname.replace('www.', '');
    
    if (cleanHostname.includes(cleanSite) || cleanSite.includes(cleanHostname)) {
      const website = websiteLimits[site];
      return website.timeUsed >= website.timeLimit;
    }
  }
  return false;
}

// Block site immediately
function blockSite(tabId, site) {
  const blockedUrl = chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site);
  chrome.tabs.update(tabId, { url: blockedUrl });
}

// Main tab listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      
      // Check if this site should be blocked
      if (shouldBlockSite(hostname)) {
        for (const site in websiteLimits) {
          const cleanSite = site.replace('www.', '');
          if (hostname.includes(cleanSite) || cleanSite.includes(hostname)) {
            blockSite(tabId, site);
            return;
          }
        }
      }
      
      // Start tracking time for this site
      for (const site in websiteLimits) {
        const cleanSite = site.replace('www.', '');
        if (hostname.includes(cleanSite) || cleanSite.includes(hostname)) {
          startTracking(site, tabId);
          break;
        }
      }
    } catch (e) {
      console.error('Error processing tab:', e);
    }
  }
});

// Start tracking time for a site
function startTracking(site, tabId) {
  // Clear any existing timer for this tab
  if (activeTimers[tabId]) {
    clearInterval(activeTimers[tabId]);
  }
  
  const startTime = Date.now();
  
  // Update time every second
  activeTimers[tabId] = setInterval(() => {
    const timeSpent = Date.now() - startTime;
    websiteLimits[site].timeUsed += 1000; // Add 1 second
    
    // Check if limit exceeded
    if (websiteLimits[site].timeUsed >= websiteLimits[site].timeLimit) {
      clearInterval(activeTimers[tabId]);
      delete activeTimers[tabId];
      blockSite(tabId, site);
    }
  }, 1000);
}

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTimers[tabId]) {
    clearInterval(activeTimers[tabId]);
    delete activeTimers[tabId];
  }
});

// Handle messages from web app
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.action === "login") {
    currentUserId = message.userId;
    chrome.storage.local.set({ userId: currentUserId });
    loadFromServer(currentUserId);
    sendResponse({ success: true });
  }
  
  if (message.action === "refreshData") {
    if (currentUserId) {
      loadFromServer(currentUserId);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  }
  
  return true;
});

// Handle internal messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getLimits") {
    sendResponse({ limits: websiteLimits });
  }
  return true;
});

// Refresh data every 30 seconds
setInterval(() => {
  if (currentUserId) {
    loadFromServer(currentUserId);
  }
}, 30000);