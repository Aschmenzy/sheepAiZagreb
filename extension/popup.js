// Handle profession selection
document.addEventListener('DOMContentLoaded', function() {
  const professionButtons = document.querySelectorAll('.profession-btn');
  const selectedProfessionDiv = document.getElementById('selectedProfession');
  const currentProfessionSpan = document.getElementById('currentProfession');
  
  // Load saved profession on popup open
  chrome.storage.sync.get(['profession'], function(result) {
    if (result.profession) {
      // Show which profession is currently selected
      professionButtons.forEach(btn => {
        if (btn.dataset.profession === result.profession) {
          btn.classList.add('selected');
        }
      });
      
      // Show the selected profession message
      currentProfessionSpan.textContent = result.profession;
      selectedProfessionDiv.style.display = 'block';
    }
  });
  
  // Handle button clicks
  professionButtons.forEach(button => {
    button.addEventListener('click', function() {
      const profession = this.dataset.profession;
      
      // Remove selected class from all buttons
      professionButtons.forEach(btn => btn.classList.remove('selected'));
      
      // Add selected class to clicked button
      this.classList.add('selected');
      
      // Save to Chrome storage
      chrome.storage.sync.set({ profession: profession }, function() {
        console.log('Profession saved:', profession);
        
        // Update the display
        currentProfessionSpan.textContent = profession;
        selectedProfessionDiv.style.display = 'block';
        
        // Optional: Show a brief confirmation
        const originalText = currentProfessionSpan.textContent;
        currentProfessionSpan.textContent = profession + ' ✓';
        setTimeout(() => {
          currentProfessionSpan.textContent = originalText;
        }, 1000);
      });
    });
  });
});