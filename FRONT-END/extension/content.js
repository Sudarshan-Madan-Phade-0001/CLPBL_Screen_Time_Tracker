const currentUrl = window.location.href;

try {
  const hostname = new URL(currentUrl).hostname;
  
  chrome.storage.local.get('websiteLimits', (data) => {
    if (!data.websiteLimits) return;
    
    const limits = data.websiteLimits;
    for (const site in limits) {
      if (hostname.includes(site)) {
        const website = limits[site];
        if (website.timeUsed >= website.timeLimit) {
          window.location.href = chrome.runtime.getURL('blocked.html') + 
            `?site=${encodeURIComponent(site)}`;
          break;
        }
      }
    }
  });
} catch (e) {}