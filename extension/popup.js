let selectedProfession = null;
let selectedInterests = [];

// Screen 1: Profession Selection
document.querySelectorAll('.profession-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    // Remove selected class from all buttons
    document.querySelectorAll('.profession-btn').forEach(b => b.classList.remove('selected'));
    
    // Add selected class to clicked button
    this.classList.add('selected');
    selectedProfession = this.dataset.profession;
    
    // Show selected profession
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

// Back button - return to profession screen
document.getElementById('backBtn').addEventListener('click', function() {
  document.getElementById('interestScreen').style.display = 'none';
  document.getElementById('professionScreen').style.display = 'block';
});

// Function to display interests screen
function showInterestsScreen(profession) {
  const questions = professionQuestions[profession];
  
  if (!questions) {
    console.error('No questions found for profession:', profession);
    return;
  }
  
  // Update title
  document.getElementById('interestTitle').textContent = questions.title;
  
  // Clear previous interests
  const interestGrid = document.getElementById('interestGrid');
  interestGrid.innerHTML = '';
  
  // Create interest buttons
  questions.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'interest-btn';
    btn.dataset.index = index;
    btn.dataset.tags = JSON.stringify(option.tags);
    
    btn.innerHTML = `
      <span class="icon">${option.icon}</span>
      <span class="title">${option.text}</span>
    `;
    
    // Toggle selection
    btn.addEventListener('click', function() {
      this.classList.toggle('selected');
      updateSelectedInterests();
    });
    
    interestGrid.appendChild(btn);
  });
  
  // Hide profession screen, show interest screen
  document.getElementById('professionScreen').style.display = 'none';
  document.getElementById('interestScreen').style.display = 'block';
}

// Update selected interests array
function updateSelectedInterests() {
  selectedInterests = [];
  document.querySelectorAll('.interest-btn.selected').forEach(btn => {
    selectedInterests.push({
      text: btn.querySelector('.title').textContent,
      tags: JSON.parse(btn.dataset.tags)
    });
  });
  console.log('Selected interests:', selectedInterests);
}

// Save preferences
document.getElementById('savePreferences').addEventListener('click', function() {
  if (selectedInterests.length === 0) {
    alert('Please select at least one interest');
    return;
  }
  
  // Save to Chrome storage
  chrome.storage.sync.set({
    profession: selectedProfession,
    interests: selectedInterests
  }, function() {
    console.log('Preferences saved!');
    alert('Preferences saved successfully!');
    
    // You can close the popup or show a success message
    // window.close();
  });
});

// Load saved preferences on popup open
chrome.storage.sync.get(['profession', 'interests'], function(result) {
  if (result.profession) {
    selectedProfession = result.profession;
    // You can auto-select the profession button if needed
  }
  if (result.interests) {
    selectedInterests = result.interests;
  }
});