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

function loadWebsiteLimits() {
  chrome.storage.local.get(['websiteLimits', 'userId'], (data) => {
    if (data.websiteLimits) {
      websiteLimits = data.websiteLimits;
    }
    
    if (data.userId) {
      currentUserId = data.userId;
    }
    
    checkAndResetDailyLimits();
  });
}

loadWebsiteLimits();
setInterval(checkAndResetDailyLimits, 60000);

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
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      
      for (const site in websiteLimits) {
        if (hostname.includes(site)) {
          const website = websiteLimits[site];
          if (website.timeUsed >= website.timeLimit) {
            chrome.tabs.update(tabId, { url: 'about:blank' });
            return;
          } else {
            startTrackingTime(site, tabId);
          }
        }
      }
    } catch (e) {}
  }
});

function startTrackingTime(site, tabId) {
  const website = websiteLimits[site];
  website.activeTabStartTime = Date.now();
  website.activeTabId = tabId;
  
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
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          try {
            const url = new URL(tab.url);
            if (url.hostname.includes(site)) {
              chrome.tabs.update(tab.id, { url: 'about:blank' });
            }
          } catch (e) {}
        });
      });
    }
  }
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === "updateLimits") {
      websiteLimits = message.limits;
      chrome.storage.local.set({ websiteLimits });
      updateBlockedSitesInLocalStorage();
      sendResponse({ success: true });
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