// Format time in milliseconds to a readable format
function formatTime(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}

// Load and display website limits
function loadWebsiteLimits() {
  const container = document.getElementById('websites-container');
  
  // Get website limits from background script
  chrome.runtime.sendMessage({ action: "getLimits" }, (response) => {
    if (!response || !response.limits) {
      container.innerHTML = `
        <div class="empty-state">
          Could not load website limits.<br>
          Please try again later.
        </div>
      `;
      return;
    }
    
    const limits = response.limits;
    const websites = Object.keys(limits);
    
    if (websites.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          No website limits set.<br>
          Open the Screen Time Tracker app to add websites.
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    websites.forEach(url => {
      const website = limits[url];
      const timeUsed = website.timeUsed;
      const timeLimit = website.timeLimit;
      const percentUsed = Math.min(100, (timeUsed / timeLimit) * 100);
      const timeRemaining = Math.max(0, timeLimit - timeUsed);
      
      const websiteItem = document.createElement('div');
      websiteItem.className = 'website-item';
      websiteItem.innerHTML = `
        <div class="website-url">${url}</div>
        <div class="time-info">
          <span>${formatTime(timeUsed)} used</span>
          <span>${formatTime(timeRemaining)} remaining</span>
        </div>
        <div class="progress-bar">
          <div class="progress ${percentUsed > 75 ? 'warning' : ''}" style="width: ${percentUsed}%"></div>
        </div>
      `;
      
      container.appendChild(websiteItem);
    });
  });
}

// Handle opening the main app
document.getElementById('open-app').addEventListener('click', () => {
  // Open the website blocker page in a new tab
  window.open('../website-blocker.html', '_blank');
});

// Load website limits when popup opens
document.addEventListener('DOMContentLoaded', loadWebsiteLimits);