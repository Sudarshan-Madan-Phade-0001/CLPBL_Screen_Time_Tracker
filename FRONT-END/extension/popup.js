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
async function loadWebsiteLimits() {
  const container = document.getElementById('websites-container');
  
  try {
    // First try to refresh data from server
    await chrome.runtime.sendMessage({ action: "refreshData" });
    
    // Then get the updated limits
    const response = await chrome.runtime.sendMessage({ action: "getLimits" });
    
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
      const timeUsed = website.timeUsed || 0;
      const timeLimit = website.timeLimit || 0;
      const percentUsed = timeLimit > 0 ? Math.min(100, (timeUsed / timeLimit) * 100) : 0;
      const timeRemaining = Math.max(0, timeLimit - timeUsed);
      
      let progressClass = '';
      let status = '';
      
      if (website.blocked || timeUsed >= timeLimit) {
        progressClass = 'danger';
        status = ' (BLOCKED)';
      } else if (percentUsed > 75) {
        progressClass = 'warning';
      }
      
      const websiteItem = document.createElement('div');
      websiteItem.className = 'website-item';
      websiteItem.innerHTML = `
        <div class="website-url">${url}${status}</div>
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
    
  } catch (error) {
    console.error("Error loading website limits:", error);
    container.innerHTML = `
      <div class="empty-state">
        Error loading data. Please try again.
      </div>
    `;
  }
}

// Handle opening the main app
document.getElementById('open-app').addEventListener('click', () => {
  chrome.tabs.create({ 
    url: 'https://clpbl-screen-time-tracker.onrender.com' 
  });
});

// Load website limits when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadWebsiteLimits();
  
  // Refresh every 5 seconds while popup is open
  setInterval(loadWebsiteLimits, 5000);
});