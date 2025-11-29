let selectedProfession = null;
let selectedInterests = [];
let additionalInterests = [];

// Wait for DOM to be fully loaded before checking setup status
document.addEventListener('DOMContentLoaded', function() {
  // Check if user has already completed setup
  chrome.storage.sync.get(['setupComplete'], function(result) {
    console.log('Setup complete?', result.setupComplete);
    if (result.setupComplete) {
      // Redirect to main screen if setup is complete
      console.log('Redirecting to main.html');
      window.location.href = 'main.html';
    }
  });

  // Initialize all event listeners
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
      alert('Please select a profession first');
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
    if (selectedInterests.length === 0) {
      alert('Please select at least one interest');
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
    btn.dataset.index = index;
    btn.dataset.tags = JSON.stringify(option.tags);
    
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

// Update selected interests array
function updateSelectedInterests() {
  selectedInterests = [];
  document.querySelectorAll('#interestGrid .interest-btn.selected').forEach(btn => {
    selectedInterests.push({
      text: btn.querySelector('.title').textContent,
      tags: JSON.parse(btn.dataset.tags)
    });
  });
  console.log('Selected interests:', selectedInterests);
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
      btn.dataset.profession = profession;
      btn.dataset.tags = JSON.stringify(option.tags);
      
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
  additionalInterests = [];
  document.querySelectorAll('#additionalContainer .interest-btn.selected').forEach(btn => {
    additionalInterests.push({
      text: btn.querySelector('.title').textContent,
      tags: JSON.parse(btn.dataset.tags),
      fromProfession: btn.dataset.profession
    });
  });
  console.log('Additional interests:', additionalInterests);
}

// Save all preferences and redirect to main screen
function saveAllPreferences() {
  const allInterests = [...selectedInterests, ...additionalInterests];
  
  chrome.storage.sync.set({
    setupComplete: true,
    profession: selectedProfession,
    primaryInterests: selectedInterests,
    additionalInterests: additionalInterests,
    allInterests: allInterests
  }, function() {
    console.log('Preferences saved!');
    console.log('Profession:', selectedProfession);
    console.log('All interests:', allInterests);
    // Redirect to main screen
    window.location.href = 'main.html';
  });
}