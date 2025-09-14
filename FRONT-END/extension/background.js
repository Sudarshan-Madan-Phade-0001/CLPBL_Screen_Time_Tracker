const API_BASE = "https://clpbl-screen-time-tracker.onrender.com/api";
let websiteLimits = {};
let currentUserId = null;

// Initialize on startup
chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);

async function initialize() {
  console.log("Extension initialized");
  const data = await chrome.storage.local.get(['userId', 'websiteLimits']);
  if (data.userId) {
    currentUserId = data.userId;
    await loadWebsiteLimits();
  }
  if (data.websiteLimits) {
    websiteLimits = data.websiteLimits;
  }
  checkDailyReset();
}

// Load website limits from server
async function loadWebsiteLimits() {
  if (!currentUserId) return;
  
  try {
    const response = await fetch(`${API_BASE}/websites?user_id=${currentUserId}`);
    const data = await response.json();
    
    if (data.success && data.websites) {
      websiteLimits = {};
      data.websites.forEach(website => {
        websiteLimits[website.website_url] = {
          timeLimit: website.time_limit * 60 * 1000, // Convert to milliseconds
          timeUsed: website.time_used * 60 * 1000,
          lastReset: website.last_reset,
          blocked: false
        };
      });
      
      await chrome.storage.local.set({ websiteLimits });
      console.log("Loaded website limits:", websiteLimits);
    }
  } catch (error) {
    console.error("Failed to load website limits:", error);
  }
}

// Check if daily reset is needed
function checkDailyReset() {
  const today = new Date().toISOString().split('T')[0];
  
  Object.keys(websiteLimits).forEach(site => {
    if (websiteLimits[site].lastReset !== today) {
      websiteLimits[site].timeUsed = 0;
      websiteLimits[site].blocked = false;
      websiteLimits[site].lastReset = today;
    }
  });
  
  chrome.storage.local.set({ websiteLimits });
}

// Check if site should be blocked
function shouldBlockSite(hostname) {
  for (const site in websiteLimits) {
    const cleanSite = site.replace('www.', '');
    const cleanHostname = hostname.replace('www.', '');
    
    if (cleanHostname.includes(cleanSite) || cleanSite.includes(cleanHostname)) {
      const limit = websiteLimits[site];
      return limit.timeUsed >= limit.timeLimit || limit.blocked;
    }
  }
  return false;
}

// Block site
function blockSite(tabId, site) {
  const blockedUrl = chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site);
  chrome.tabs.update(tabId, { url: blockedUrl });
  
  // Mark as blocked
  if (websiteLimits[site]) {
    websiteLimits[site].blocked = true;
    chrome.storage.local.set({ websiteLimits });
  }
}

// Track time for site
function trackTime(site) {
  if (!websiteLimits[site] || websiteLimits[site].blocked) return;
  
  websiteLimits[site].timeUsed += 1000; // Add 1 second
  
  // Check if limit exceeded
  if (websiteLimits[site].timeUsed >= websiteLimits[site].timeLimit) {
    websiteLimits[site].blocked = true;
    
    // Block all tabs with this site
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes(site)) {
          blockSite(tab.id, site);
        }
      });
    });
  }
  
  chrome.storage.local.set({ websiteLimits });
}

// Main tab listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      
      // Check if should block immediately
      if (shouldBlockSite(hostname)) {
        for (const site in websiteLimits) {
          const cleanSite = site.replace('www.', '');
          if (hostname.includes(cleanSite) || cleanSite.includes(hostname)) {
            blockSite(tabId, site);
            return;
          }
        }
      }
      
      // Start tracking time
      for (const site in websiteLimits) {
        const cleanSite = site.replace('www.', '');
        if (hostname.includes(cleanSite) || cleanSite.includes(hostname)) {
          // Track time every second
          const interval = setInterval(() => {
            chrome.tabs.get(tabId, (currentTab) => {
              if (chrome.runtime.lastError || !currentTab || !currentTab.url || !currentTab.url.includes(site)) {
                clearInterval(interval);
                return;
              }
              trackTime(site);
            });
          }, 1000);
          break;
        }
      }
    } catch (e) {
      console.error("Error processing tab:", e);
    }
  }
});

// Handle messages from popup and web app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getLimits") {
    sendResponse({ limits: websiteLimits });
    return true;
  }
  
  if (message.action === "refreshData") {
    loadWebsiteLimits().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle external messages from web app
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.action === "login") {
    currentUserId = message.userId;
    chrome.storage.local.set({ userId: currentUserId });
    loadWebsiteLimits().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === "refreshData") {
    loadWebsiteLimits().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Check for daily reset every minute
setInterval(checkDailyReset, 60000);

// Refresh data every 30 seconds
setInterval(() => {
  if (currentUserId) {
    loadWebsiteLimits();
  }
}, 30000);

// Initialize immediately
initialize();