// Load and display user preferences
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(['profession', 'allInterests'], function(result) {
    const profession = result.profession || '-';
    const interests = result.allInterests || [];
    
    console.log('Loaded profession:', profession);
    console.log('Loaded interests:', interests);
    
    document.getElementById('dashboardProfession').textContent = profession;
    document.getElementById('dashboardInterestCount').textContent = `${interests.length} selected`;
    
    // Display interest tags
    const tagsContainer = document.getElementById('dashboardTags');
    tagsContainer.innerHTML = '';
    
    if (interests.length > 0) {
      interests.forEach(interest => {
        const tag = document.createElement('span');
        tag.className = 'interest-tag';
        tag.textContent = interest.text;
        tagsContainer.appendChild(tag);
      });
    } else {
      tagsContainer.innerHTML = '<p class="no-interests">No interests selected</p>';
    }
  });

  // Initialize event listeners
  initializeEventListeners();
});

function initializeEventListeners() {
  // View filtered news - open thehackernews.com
  document.getElementById('viewFiltered').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://thehackernews.com' });
  });

  // Edit preferences - go back to setup
  document.getElementById('editPreferences').addEventListener('click', function() {
    // Clear setup complete flag to allow editing
    chrome.storage.sync.set({ setupComplete: false }, function() {
      window.location.href = 'popup.html';
    });
  });

  // Reset all preferences
  document.getElementById('resetPreferences').addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all preferences? This will restart the setup process.')) {
      chrome.storage.sync.clear(function() {
        console.log('All preferences cleared');
        window.location.href = 'popup.html';
      });
    }
  });
}