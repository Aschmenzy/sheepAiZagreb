// Load and display user preferences
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(['profession', 'allInterests', 'summaryLevel'], function(result) {
    const profession = result.profession || '-';
    const interests = result.allInterests || [];
    const summaryLevel = result.summaryLevel !== undefined ? result.summaryLevel : 1; // Default to medium (1)
    
    console.log('Loaded profession:', profession);
    console.log('Loaded interests:', interests);
    console.log('Loaded summary level:', summaryLevel);
    
    document.getElementById('dashboardProfession').textContent = profession;
    document.getElementById('dashboardInterestCount').textContent = `${interests.length} selected`;
    
    // Set summary slider value
    document.getElementById('summarySlider').value = summaryLevel;
    updateSummaryLabel(summaryLevel);
    
    // Display interests in dropdown
    displayInterestsDropdown(interests);
  });

  // Check if user is on thehackernews.com to show/hide Chat with AI button
  checkCurrentTab();

  // Initialize event listeners
  initializeEventListeners();
});

// Check current tab and show/hide Chat with AI button accordingly
function checkCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const chatButton = document.getElementById('chatWithAI');
    
    if (tabs[0] && tabs[0].url) {
      const url = tabs[0].url;
      // Check if URL matches thehackernews.com/2025/
      if (url.includes('thehackernews.com/2025/')) {
        chatButton.style.display = 'block';
        
        // Update button text with article title
        const title = tabs[0].title;
        if (title) {
          // Remove " - The Hacker News" or similar suffix
          const cleanTitle = title.replace(/\s*[-–—]\s*The Hacker News.*$/i, '').trim();
          
          // Truncate if too long
          const maxLength = 50;
          const displayTitle = cleanTitle.length > maxLength 
            ? cleanTitle.substring(0, maxLength) + '...' 
            : cleanTitle;
          
          chatButton.innerHTML = `🤖 Chat About: ${displayTitle}`;
        } else {
          chatButton.innerHTML = '🤖 Chat with AI About Articles';
        }
      } else {
        chatButton.style.display = 'none';
      }
    } else {
      // If we can't determine the URL, hide the button
      chatButton.style.display = 'none';
    }
  });
}

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

  // Summary slider - 3 discrete levels
  const slider = document.getElementById('summarySlider');
  
  // Snap to nearest level on change
  slider.addEventListener('change', function() {
    const value = snapToLevel(parseInt(this.value));
    this.value = value;
    updateSummaryLabel(value);
    
    // Save to storage
    chrome.storage.sync.set({ summaryLevel: value }, function() {
      console.log('Summary level saved:', value);
    });
  });
  
  // Update label while dragging
  slider.addEventListener('input', function() {
    const value = parseInt(this.value);
    updateSummaryLabel(value);
  });

  // View filtered news - open thehackernews.com
  document.getElementById('viewFiltered').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://thehackernews.com' });
  });

  // Chat with AI button
  document.getElementById('chatWithAI').addEventListener('click', function() {
    // Send message to content script to open chat panel
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "openChat" });
        window.close(); // Close the popup
      }
    });
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

// Snap slider value to one of 3 discrete levels
function snapToLevel(value) {
  // 0 = No Summary, 1 = Medium Summary, 2 = Full Summary
  if (value < 1) return 0;
  if (value > 1) return 2;
  return 1;
}

function updateSummaryLabel(value) {
  const label = document.getElementById('summaryLevel');
  const levelValue = snapToLevel(value);
  
  switch(levelValue) {
    case 0:
      label.textContent = '📖 No Summary (Full Article)';
      label.style.color = '#10b981';
      label.style.borderColor = '#10b981';
      break;
    case 1:
      label.textContent = '📝 Medium Summary';
      label.style.color = '#667eea';
      label.style.borderColor = '#667eea';
      break;
    case 2:
      label.textContent = '⚡ Brief Summary';
      label.style.color = '#764ba2';
      label.style.borderColor = '#764ba2';
      break;
  }
}