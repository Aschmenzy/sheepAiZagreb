let selectedProfession = null;
let selectedPrimaryInterests = [];
let selectedAdditionalInterests = [];
let userId = null;

// Map profession interests to their IDs from the backend
const INTEREST_NAME_TO_ID = {
  // Security Engineer (1-6)
  "Vulnerability Research & Exploit Development": 1,
  "Application Security & Secure Coding": 2,
  "Network Security & Firewalls": 3,
  "Cloud Security (AWS, Azure, GCP)": 4,
  "Identity & Access Management": 5,
  "Mobile Security & IoT": 6,
  
  // Software Developer (7-12)
  "Frontend Frameworks (React, Vue, Angular)": 7,
  "Backend & APIs (Node, Python, Go)": 8,
  "Databases & Data Engineering": 9,
  "AI/ML & Machine Learning Tools": 10,
  "Mobile Development (iOS, Android, Flutter)": 11,
  "Game Development & Graphics": 12,
  
  // DevOps/SRE (13-18)
  "Containers & Orchestration (Docker, K8s)": 13,
  "CI/CD & Automation Pipelines": 14,
  "Cloud Infrastructure (AWS, Azure, GCP)": 15,
  "Monitoring & Observability": 16,
  "Infrastructure as Code (Terraform, Ansible)": 17,
  "Performance & Site Reliability": 18,
  
  // System Administrator (19-24)
  "Linux Administration & Shell Scripting": 19,
  "Windows Server & Active Directory": 20,
  "Networking & DNS Management": 21,
  "Storage & Backup Solutions": 22,
  "Virtualization (VMware, Hyper-V)": 23,
  "Automation & Configuration Management": 24,
  
  // Security Analyst (25-30)
  "Threat Intelligence & Threat Hunting": 25,
  "Incident Response & Forensics": 26,
  "Security Operations & SIEM": 27,
  "Malware Analysis & Reverse Engineering": 28,
  "Penetration Testing & Red Teaming": 29,
  "Compliance & Risk Management": 30,
  
  // Other (31-36)
  "Cybersecurity & Privacy": 31,
  "Software Development & Programming": 32,
  "Cloud & Infrastructure": 33,
  "AI & Machine Learning": 34,
  "Data Science & Analytics": 35,
  "Web Technologies & Frameworks": 36
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Check if user already exists and setup is complete
  const stored = await chrome.storage.sync.get(['userId', 'profession', 'setupComplete']);
  
  // If setup is complete, redirect to main screen
  if (stored.setupComplete) {
    console.log('Setup already complete, redirecting to main.html');
    window.location.href = 'main.html';
    return;
  }
  
  if (stored.userId) {
    userId = stored.userId;
    try {
      // Load user data from backend
      const userData = await ApiService.getUser(userId);
      selectedProfession = userData.job;
      
      // Pre-select profession button
      document.querySelectorAll('.profession-btn').forEach(btn => {
        if (btn.dataset.profession === selectedProfession) {
          btn.classList.add('selected');
          document.getElementById('selectedProfession').style.display = 'block';
          document.getElementById('currentProfession').textContent = selectedProfession;
        }
      });
      
      console.log('Loaded existing user:', userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
  
  initializeEventListeners();
});

function initializeEventListeners() {
  // Screen 1: Profession Selection
  document.querySelectorAll('.profession-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.profession-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      selectedProfession = this.dataset.profession;
      
      document.getElementById('selectedProfession').style.display = 'block';
      document.getElementById('currentProfession').textContent = selectedProfession;
    });
  });

  // Next button - go to interests screen
  document.getElementById('nextToProfession').addEventListener('click', function() {
    if (!selectedProfession) {
      showError('Please select a profession first');
      return;
    }
    
    showInterestsScreen(selectedProfession);
  });

  // Back button from interest screen
  document.getElementById('backBtn').addEventListener('click', function() {
    document.getElementById('interestScreen').style.display = 'none';
    document.getElementById('professionScreen').style.display = 'block';
  });

  // Next button - go to additional interests
  document.getElementById('nextToAdditional').addEventListener('click', function() {
    if (selectedPrimaryInterests.length === 0) {
      showError('Please select at least one interest');
      return;
    }
    
    showAdditionalInterestsScreen();
  });

  // Back button from additional screen
  document.getElementById('backFromAdditional').addEventListener('click', function() {
    document.getElementById('additionalScreen').style.display = 'none';
    document.getElementById('interestScreen').style.display = 'block';
  });

  // Skip additional interests
  document.getElementById('skipAdditional').addEventListener('click', function() {
    saveAllPreferences();
  });

  // Save preferences button
  document.getElementById('savePreferences').addEventListener('click', function() {
    saveAllPreferences();
  });
}

// Function to display interests screen
function showInterestsScreen(profession) {
  const questions = professionQuestions[profession];
  
  if (!questions) {
    console.error('No questions found for profession:', profession);
    return;
  }
  
  document.getElementById('interestTitle').textContent = questions.title;
  
  const interestGrid = document.getElementById('interestGrid');
  interestGrid.innerHTML = '';
  
  questions.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'interest-btn';
    btn.dataset.interestName = option.text;
    
    btn.innerHTML = `
      <span class="icon">${option.icon}</span>
      <span class="title">${option.text}</span>
    `;
    
    btn.addEventListener('click', function() {
      this.classList.toggle('selected');
      updateSelectedInterests();
    });
    
    interestGrid.appendChild(btn);
  });
  
  document.getElementById('professionScreen').style.display = 'none';
  document.getElementById('interestScreen').style.display = 'block';
}

// Update selected primary interests array
function updateSelectedInterests() {
  selectedPrimaryInterests = [];
  document.querySelectorAll('#interestGrid .interest-btn.selected').forEach(btn => {
    const interestName = btn.dataset.interestName;
    const interestId = INTEREST_NAME_TO_ID[interestName];
    if (interestId) {
      selectedPrimaryInterests.push(interestId);
    }
  });
  console.log('Selected primary interests:', selectedPrimaryInterests);
}

// Function to display additional interests from other professions
function showAdditionalInterestsScreen() {
  const container = document.getElementById('additionalContainer');
  container.innerHTML = '';
  
  const otherProfessions = Object.keys(professionQuestions).filter(
    prof => prof !== selectedProfession
  );
  
  otherProfessions.forEach(profession => {
    const questions = professionQuestions[profession];
    
    const section = document.createElement('div');
    section.className = 'additional-category';
    
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <span class="category-title">${profession}</span>
      <span class="toggle-icon">▼</span>
    `;
    
    const grid = document.createElement('div');
    grid.className = 'additional-grid';
    grid.style.display = 'none';
    
    questions.options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'interest-btn small';
      btn.dataset.interestName = option.text;
      
      btn.innerHTML = `
        <span class="icon">${option.icon}</span>
        <span class="title">${option.text}</span>
      `;
      
      btn.addEventListener('click', function() {
        this.classList.toggle('selected');
        updateAdditionalInterests();
      });
      
      grid.appendChild(btn);
    });
    
    header.addEventListener('click', function() {
      const isVisible = grid.style.display === 'grid';
      grid.style.display = isVisible ? 'none' : 'grid';
      header.querySelector('.toggle-icon').textContent = isVisible ? '▼' : '▲';
    });
    
    section.appendChild(header);
    section.appendChild(grid);
    container.appendChild(section);
  });
  
  document.getElementById('interestScreen').style.display = 'none';
  document.getElementById('additionalScreen').style.display = 'block';
}

// Update additional interests array
function updateAdditionalInterests() {
  selectedAdditionalInterests = [];
  document.querySelectorAll('#additionalContainer .interest-btn.selected').forEach(btn => {
    const interestName = btn.dataset.interestName;
    const interestId = INTEREST_NAME_TO_ID[interestName];
    if (interestId) {
      selectedAdditionalInterests.push(interestId);
    }
  });
  console.log('Additional interests:', selectedAdditionalInterests);
}

// Save all preferences and send to backend
async function saveAllPreferences() {
  const allInterestIds = [...selectedPrimaryInterests, ...selectedAdditionalInterests];
  
  if (!selectedProfession || allInterestIds.length === 0) {
    showError('Please select your profession and at least one interest');
    return;
  }
  
  try {
    showLoading(true);
    
    let result;
    if (userId) {
      // Update existing user
      console.log('Updating user:', userId);
      result = await ApiService.updateUser(userId, selectedProfession, allInterestIds);
    } else {
      // Create new user
      console.log('Creating new user');
      result = await ApiService.createUser(selectedProfession, allInterestIds);
      userId = result.userId;
    }
    
    // Save to Chrome storage
    await chrome.storage.sync.set({
      setupComplete: true,
      userId: userId,
      profession: selectedProfession,
      interestIds: allInterestIds
    });
    
    console.log('Preferences saved successfully!');
    console.log('User ID:', userId);
    console.log('Profession:', selectedProfession);
    console.log('Interest IDs:', allInterestIds);
    
    // Redirect to main screen
    window.location.href = 'main.html';
    
  } catch (error) {
    console.error('Error saving preferences:', error);
    showError(error.message || 'Failed to save preferences. Make sure the backend is running on http://127.0.0.1:5000');
  } finally {
    showLoading(false);
  }
}

// Show error message
function showError(message) {
  alert('Error: ' + message);
}

// Show success message
function showSuccess(message) {
  alert(message);
}

// Show/hide loading state
function showLoading(show) {
  const saveBtn = document.getElementById('savePreferences');
  const skipBtn = document.getElementById('skipAdditional');
  
  if (show) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    if (skipBtn) skipBtn.disabled = true;
  } else {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Preferences';
    if (skipBtn) skipBtn.disabled = false;
  }
}