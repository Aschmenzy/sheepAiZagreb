let userId = null;
let userProfession = null;
let userInterests = [];

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Check if user has completed setup
  const stored = await chrome.storage.sync.get(['userId', 'profession', 'interestIds', 'setupComplete']);
  
  if (!stored.setupComplete) {
    // Redirect to setup if not complete
    console.log('Setup not complete, redirecting to popup.html');
    window.location.href = 'popup.html';
    return;
  }
  
  userId = stored.userId;
  
  // Load user data from backend
  await loadUserProfile();
  
  // Initialize event listeners
  initializeEventListeners();
});

async function loadUserProfile() {
  try {
    const userData = await ApiService.getUser(userId);
    
    userProfession = userData.job;
    userInterests = userData.interests;
    
    // Display profession
    document.getElementById('dashboardProfession').textContent = userProfession;
    
    // Display interest count
    document.getElementById('dashboardInterestCount').textContent = `${userInterests.length} selected`;
    
    // Populate interests dropdown
    populateInterestsDropdown();
    
    console.log('User profile loaded:', userData);
  } catch (error) {
    console.error('Error loading user profile:', error);
    document.getElementById('dashboardProfession').textContent = 'Error loading profile';
    document.getElementById('dashboardInterestCount').textContent = 'Error';
  }
}

function populateInterestsDropdown() {
  const dropdownContent = document.getElementById('dropdownContent');
  dropdownContent.innerHTML = '';
  
  if (userInterests.length === 0) {
    dropdownContent.innerHTML = '<div class="interest-item">No interests selected</div>';
    return;
  }
  
  userInterests.forEach(interest => {
    const item = document.createElement('div');
    item.className = 'interest-item';
    item.innerHTML = `
      <span class="interest-icon">✓</span>
      <span class="interest-name">${interest.name}</span>
    `;
    dropdownContent.appendChild(item);
  });
}

function initializeEventListeners() {
  // Dropdown toggle
  const dropdownHeader = document.getElementById('dropdownHeader');
  const dropdownContent = document.getElementById('dropdownContent');
  const dropdownArrow = document.getElementById('dropdownArrow');
  
  dropdownHeader.addEventListener('click', function() {
    const isOpen = dropdownContent.classList.contains('open');
    
    if (isOpen) {
      dropdownContent.classList.remove('open');
      dropdownArrow.textContent = '▼';
    } else {
      dropdownContent.classList.add('open');
      dropdownArrow.textContent = '▲';
    }
  });
  
  // Summary slider - FIXED VERSION
  const summarySlider = document.getElementById('summarySlider');
  const summaryLevel = document.getElementById('summaryLevel');
  
  summarySlider.addEventListener('input', function() {
    const value = parseInt(this.value); // Parse as integer since slider is 0-2
    let levelText = 'Medium Summary';
    let emoji = '📝';
    
    if (value === 0) {
      levelText = 'Full Articles';
      emoji = '📄';
    } else if (value === 1) {
      levelText = 'Medium Summary';
      emoji = '📝';
    } else if (value === 2) {
      levelText = 'Brief Summary';
      emoji = '⚡';
    }
    
    summaryLevel.textContent = `${emoji} ${levelText}`;
    
    // Save summary preference
    chrome.storage.sync.set({ summaryLevel: value });
    console.log('Summary level saved:', value, levelText);
  });
  
  // Load saved summary level
  chrome.storage.sync.get(['summaryLevel'], function(result) {
    if (result.summaryLevel !== undefined) {
      summarySlider.value = result.summaryLevel;
      summarySlider.dispatchEvent(new Event('input'));
    } else {
      // Default to medium (value 1)
      summarySlider.value = 1;
      summarySlider.dispatchEvent(new Event('input'));
    }
  });
  
  // View Filtered News button
  document.getElementById('viewFiltered').addEventListener('click', function() {
    // Open thehackernews.com
    chrome.tabs.create({ url: 'https://thehackernews.com' });
  });
  
  // Chat with AI button
  document.getElementById('chatWithAI').addEventListener('click', function() {
    // Open thehackernews.com and trigger chat mode
    chrome.tabs.create({ url: 'https://thehackernews.com' }, function(tab) {
      // Send message to open chat after page loads
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { action: 'openChat' });
      }, 2000);
    });
  });
  
  // Edit Preferences button
  document.getElementById('editPreferences').addEventListener('click', async function() {
    // Clear setupComplete to allow editing
    await chrome.storage.sync.set({ setupComplete: false });
    window.location.href = 'popup.html';
  });
  
  // Reset Preferences button
  document.getElementById('resetPreferences').addEventListener('click', async function() {
    if (confirm('Are you sure you want to reset all preferences? This will delete your account and you will need to set up again.')) {
      try {
        // Clear Chrome storage
        await chrome.storage.sync.clear();
        
        // Note: We could also delete the user from backend here if we had a DELETE endpoint
        // await ApiService.deleteUser(userId);
        
        // Redirect to setup
        window.location.href = 'popup.html';
      } catch (error) {
        console.error('Error resetting preferences:', error);
        alert('Error resetting preferences. Please try again.');
      }
    }
  });
}