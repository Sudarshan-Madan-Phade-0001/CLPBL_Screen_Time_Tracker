function exportWebsiteData() {
  try {
    const websiteData = localStorage.getItem('digital_detox_website_limits');
    
    if (!websiteData) {
      console.error('No website data found in localStorage');
      return;
    }
    
    const websites = JSON.parse(websiteData);
    
    const formattedData = websites.map(site => ({
      url: site.url,
      timeUsed: site.timeUsed,
      timeLimit: site.timeLimit,
      lastReset: site.lastReset
    }));
    
    console.log('Website data to export:', JSON.stringify(formattedData, null, 2));
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formattedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "website_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  } catch (error) {
    console.error('Error exporting website data:', error);
  }
}

function addExportButton() {
  const container = document.querySelector('.website-list');
  if (!container) return;
  
  const exportButton = document.createElement('button');
  exportButton.textContent = 'Export Usage Data for Analysis';
  exportButton.style.marginTop = '20px';
  exportButton.style.backgroundColor = '#077b32';
  exportButton.style.color = 'white';
  exportButton.style.border = 'none';
  exportButton.style.padding = '10px 15px';
  exportButton.style.borderRadius = '5px';
  exportButton.style.cursor = 'pointer';
  
  exportButton.addEventListener('click', exportWebsiteData);
  
  container.appendChild(exportButton);
}

document.addEventListener('DOMContentLoaded', addExportButton);