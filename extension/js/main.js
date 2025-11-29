// Load and display user preferences
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(['profession', 'allInterests', 'summaryLevel'], function(result) {
    const profession = result.profession || '-';
    const interests = result.allInterests || [];
    const summaryLevel = result.summaryLevel || 50;
    
    console.log('Loaded profession:', profession);
    console.log('Loaded interests:', interests);
    
    document.getElementById('dashboardProfession').textContent = profession;
    document.getElementById('dashboardInterestCount').textContent = `${interests.length} selected`;
    
    // Set summary slider value
    document.getElementById('summarySlider').value = summaryLevel;
    updateSummaryLabel(summaryLevel);
    
    // Display interests in dropdown
    displayInterestsDropdown(interests);
  });

  // Initialize event listeners
  initializeEventListeners();
});

function displayInterestsDropdown(interests) {
  const dropdownContent = document.getElementById('dropdownContent');
  const dropdownHeaderText = document.getElementById('dropdownHeaderText');
  
  dropdownContent.innerHTML = '';
  
  if (interests.length > 0) {
    // Update header text
    dropdownHeaderText.textContent = `${interests.length} interest${interests.length !== 1 ? 's' : ''} selected`;
    
    // Add each interest to dropdown
    interests.forEach(interest => {
      const item = document.createElement('div');
      item.className = 'interest-item';
      item.innerHTML = `
        <span class="interest-bullet"></span>
        <span>${interest.text}</span>
      `;
      dropdownContent.appendChild(item);
    });
  } else {
    dropdownHeaderText.textContent = 'No interests selected';
    dropdownContent.innerHTML = '<p class="no-interests">No interests selected</p>';
  }
}

function initializeEventListeners() {
  // Dropdown toggle
  const dropdownHeader = document.getElementById('dropdownHeader');
  const dropdownContent = document.getElementById('dropdownContent');
  const dropdownArrow = document.getElementById('dropdownArrow');
  
  dropdownHeader.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownContent.classList.toggle('open');
    dropdownArrow.classList.toggle('open');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!dropdownHeader.contains(e.target) && !dropdownContent.contains(e.target)) {
      dropdownContent.classList.remove('open');
      dropdownArrow.classList.remove('open');
    }
  });

  // Summary slider
  const slider = document.getElementById('summarySlider');
  slider.addEventListener('input', function() {
    const value = this.value;
    updateSummaryLabel(value);
    
    // Save to storage
    chrome.storage.sync.set({ summaryLevel: parseInt(value) }, function() {
      console.log('Summary level saved:', value);
    });
  });

  // View filtered news - open thehackernews.com
  document.getElementById('viewFiltered').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://thehackernews.com' });
  });

  // Chat with AI button
  document.getElementById('chatWithAI').addEventListener('click', function() {
    // Open Claude.ai or your AI chat interface
    chrome.tabs.create({ url: 'https://claude.ai' });
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

function updateSummaryLabel(value) {
  const label = document.getElementById('summaryLevel');
  if (value < 33) {
    label.textContent = 'Full Articles';
  } else if (value < 66) {
    label.textContent = 'Medium Summary';
  } else {
    label.textContent = 'Brief Summary';
  }
}