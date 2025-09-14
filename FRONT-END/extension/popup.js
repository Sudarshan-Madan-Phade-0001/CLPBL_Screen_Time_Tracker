// Format time in milliseconds to readable format
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
  
  chrome.runtime.sendMessage({ action: "getLimits" }, (response) => {
    if (!response || !response.limits) {
      container.innerHTML = `
        <div class="empty-state">
          No website limits set.<br>
          Open the Screen Time Tracker app to add websites.
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
      
      let progressClass = '';
      if (percentUsed > 90) progressClass = 'danger';
      else if (percentUsed > 75) progressClass = 'warning';
      
      const websiteItem = document.createElement('div');
      websiteItem.className = 'website-item';
      websiteItem.innerHTML = `
        <div class="website-url">${url}</div>
        <div class="time-info">
          <span>${formatTime(timeUsed)} used</span>
          <span>${formatTime(timeRemaining)} remaining</span>
        </div>
        <div class="progress-bar">
          <div class="progress ${progressClass}" style="width: ${percentUsed}%"></div>
        </div>
      `;
      
      container.appendChild(websiteItem);
    });
  });
}

// Handle opening the main app
document.getElementById('open-app').addEventListener('click', () => {
  chrome.tabs.create({ 
    url: 'https://clpbl-screen-time-tracker.onrender.com' 
  });
});

// Load website limits when popup opens
document.addEventListener('DOMContentLoaded', loadWebsiteLimits);