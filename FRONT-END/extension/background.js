let websiteLimits = {};
let serverUrl = "https://clpbl-screen-time-tracker.onrender.com";
let currentUserId = null;

function checkAndResetDailyLimits() {
  const today = new Date().toISOString().split('T')[0];
  let updated = false;
  
  Object.keys(websiteLimits).forEach(url => {
    const website = websiteLimits[url];
    if (website.lastReset !== today) {
      website.timeUsed = 0;
      website.lastReset = today;
      console.log(`Reset time limit for ${url}`);
      updated = true;
    }
  });
  
  if (updated) {
    chrome.storage.local.set({ websiteLimits });
    updateBlockedSitesInLocalStorage();
    unblockAllSites();
    console.log("Daily limits reset at:", new Date().toLocaleTimeString());
  }
}

function unblockAllSites() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      try {
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
          return;
        }
        
        if (tab.url === 'about:blank') {
          chrome.tabs.reload(tab.id);
        }
      } catch (e) {}
    });
  });
}

function updateBlockedSitesInLocalStorage() {
  const blockedSites = {};
  
  Object.keys(websiteLimits).forEach(site => {
    if (websiteLimits[site].timeUsed >= websiteLimits[site].timeLimit) {
      blockedSites[site] = true;
    }
  });
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      try {
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
          return;
        }
        
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (blockedSitesJson) => {
            try {
              localStorage.setItem('blockedSites', blockedSitesJson);
            } catch (e) {}
          },
          args: [JSON.stringify(blockedSites)]
        }).catch(() => {});
      } catch (e) {}
    });
  });
}

async function loadWebsiteLimits() {
  chrome.storage.local.get(['websiteLimits', 'userId'], async (data) => {
    if (data.websiteLimits) {
      websiteLimits = data.websiteLimits;
    }
    
    if (data.userId) {
      currentUserId = data.userId;
      // Load from server
      await loadFromServer(data.userId);
    }
    
    checkAndResetDailyLimits();
  });
}

async function loadFromServer(userId) {
  try {
    const response = await fetch(`${serverUrl}/api/websites?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success && data.websites) {
      websiteLimits = {};
      data.websites.forEach(website => {
        websiteLimits[website.website_url] = {
          timeLimit: website.time_limit * 60 * 1000, // Convert minutes to milliseconds
          timeUsed: 0, // Start with 0 for testing
          lastReset: website.last_reset
        };
      });
      chrome.storage.local.set({ websiteLimits });
      console.log('Loaded website limits from server:', websiteLimits);
    }
  } catch (error) {
    console.error('Failed to load from server:', error);
  }
}

loadWebsiteLimits();
setInterval(checkAndResetDailyLimits, 60000);
// Refresh data from server every 30 seconds
setInterval(() => {
  if (currentUserId) {
    loadFromServer(currentUserId);
  }
}, 30000);

function forceResetAllLimits() {
  const today = new Date().toISOString().split('T')[0];
  
  Object.keys(websiteLimits).forEach(url => {
    websiteLimits[url].timeUsed = 0;
    websiteLimits[url].lastReset = today;
  });
  
  chrome.storage.local.set({ websiteLimits });
  updateBlockedSitesInLocalStorage();
  unblockAllSites();
  
  console.log("Manually reset all website limits at:", new Date().toLocaleTimeString());
  return true;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkAndBlockSite(tabId, tab.url);
  }
});

function checkAndBlockSite(tabId, url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    console.log('Checking site:', hostname);
    console.log('Website limits:', websiteLimits);
    
    for (const site in websiteLimits) {
      const cleanSite = site.replace('www.', '');
      if (hostname.includes(cleanSite) || cleanSite.includes(hostname)) {
        const website = websiteLimits[site];
        console.log(`Found match: ${site}, timeUsed: ${website.timeUsed}, timeLimit: ${website.timeLimit}`);
        
        if (website.timeUsed >= website.timeLimit) {
          console.log(`Blocking ${site}`);
          chrome.tabs.update(tabId, { 
            url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site)
          });
          return;
        } else {
          startTrackingTime(site, tabId);
        }
        break;
      }
    }
  } catch (e) {
    console.error('Error checking site:', e);
  }
}

function startTrackingTime(site, tabId) {
  const website = websiteLimits[site];
  website.activeTabStartTime = Date.now();
  website.activeTabId = tabId;
  
  console.log(`Started tracking time for ${site}`);
  
  // For testing: block after 10 seconds
  setTimeout(() => {
    if (website.activeTabId === tabId) {
      console.log(`Test blocking ${site} after 10 seconds`);
      chrome.tabs.update(tabId, { 
        url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site)
      });
    }
  }, 10000);
  
  chrome.tabs.onRemoved.addListener(function tabCloseListener(closedTabId) {
    if (closedTabId === tabId) {
      updateTimeUsed(site);
      chrome.tabs.onRemoved.removeListener(tabCloseListener);
    }
  });
}

function updateTimeUsed(site) {
  const website = websiteLimits[site];
  if (website && website.activeTabStartTime) {
    const timeSpentMs = Date.now() - website.activeTabStartTime;
    website.timeUsed += timeSpentMs;
    website.activeTabStartTime = null;
    website.activeTabId = null;
    
    chrome.storage.local.set({ websiteLimits });
    updateBlockedSitesInLocalStorage();
    
    if (website.timeUsed >= website.timeLimit) {
      console.log(`Time limit reached for ${site}`);
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          try {
            const url = new URL(tab.url);
            const hostname = url.hostname.replace('www.', '');
            const cleanSite = site.replace('www.', '');
            if (hostname.includes(cleanSite) || cleanSite.includes(hostname)) {
              chrome.tabs.update(tab.id, { 
                url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site)
              });
            }
          } catch (e) {}
        });
      });
    }
  }
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === "login") {
      currentUserId = message.userId;
      chrome.storage.local.set({ userId: currentUserId });
      loadFromServer(currentUserId);
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === "updateLimits") {
      websiteLimits = message.limits;
      chrome.storage.local.set({ websiteLimits });
      updateBlockedSitesInLocalStorage();
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === "refreshData") {
      if (currentUserId) {
        loadFromServer(currentUserId);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
      return true;
    }
    
    if (message.action === "timeUp") {
      const site = message.website;
      if (websiteLimits[site]) {
        websiteLimits[site].timeUsed = websiteLimits[site].timeLimit;
        chrome.storage.local.set({ websiteLimits });
        updateBlockedSitesInLocalStorage();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
      return true;
    }
    
    if (message.action === "resetAllLimits") {
      const result = forceResetAllLimits();
      sendResponse({ success: result });
      return true;
    }
  } catch (e) {
    sendResponse({ success: false });
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === "getLimits") {
      sendResponse({ limits: websiteLimits });
      return true;
    }
    
    if (message.action === "resetLimits") {
      const result = forceResetAllLimits();
      sendResponse({ success: result });
      return true;
    }
  } catch (e) {
    sendResponse({ success: false });
    return true;
  }
});