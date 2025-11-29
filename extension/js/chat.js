let articleContent = '';
let articleTitle = '';
let conversationHistory = [];

// Load article content when page loads
document.addEventListener('DOMContentLoaded', async function() {
  // Get the article URL from the query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const articleUrl = urlParams.get('url');
  
  if (!articleUrl) {
    showError('No article URL provided');
    return;
  }
  
  // Fetch and load the article
  await loadArticle(articleUrl);
  
  // Initialize event listeners
  initializeEventListeners();
});

async function loadArticle(url) {
  try {
    // Fetch the article page
    const response = await fetch(url);
    const html = await response.text();
    
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Get article title
    const titleElement = doc.querySelector('.story-title') || doc.querySelector('h1');
    if (titleElement) {
      articleTitle = titleElement.textContent.trim();
      document.getElementById('articleTitle').textContent = articleTitle;
    }
    
    // Get article content
    const articleBody = doc.querySelector('.articlebody');
    if (articleBody) {
      const paragraphs = articleBody.querySelectorAll('p');
      let fullText = '';
      paragraphs.forEach(p => {
        fullText += p.textContent.trim() + '\n\n';
      });
      articleContent = fullText.trim();
      
      console.log('Article loaded:', articleTitle);
      console.log('Content length:', articleContent.length);
    } else {
      showError('Could not extract article content');
    }
  } catch (error) {
    console.error('Error loading article:', error);
    showError('Failed to load article: ' + error.message);
  }
}

function initializeEventListeners() {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const closeBtn = document.getElementById('closeBtn');
  
  // Send message on button click
  sendBtn.addEventListener('click', sendMessage);
  
  // Send message on Enter (but allow Shift+Enter for new line)
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Auto-resize textarea as user types
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
  });
  
  // Close button - close the tab
  closeBtn.addEventListener('click', function() {
    window.close();
  });
}

async function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const messageText = chatInput.value.trim();
  
  if (!messageText) return;
  
  // Clear input and reset height
  chatInput.value = '';
  chatInput.style.height = 'auto';
  
  // Add user message to chat
  addMessage('user', messageText);
  
  // Show loading indicator
  showLoading();
  
  // Get AI response
  try {
    const response = await getAIResponse(messageText);
    removeLoading();
    addMessage('ai', response);
  } catch (error) {
    removeLoading();
    addMessage('error', 'Error: ' + error.message);
  }
}

function addMessage(type, content) {
  const messagesContainer = document.getElementById('chatMessages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;
  
  let icon = '🤖';
  if (type === 'user') icon = '👤';
  if (type === 'error') icon = '⚠️';
  
  messageDiv.innerHTML = `
    <div class="message-icon">${icon}</div>
    <div class="message-content">
      ${formatMessageContent(content)}
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatMessageContent(content) {
  // Remove markdown code blocks if present
  content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Convert newlines to paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  if (paragraphs.length === 1) {
    return `<p>${content}</p>`;
  }
  
  return paragraphs.map(p => `<p>${p}</p>`).join('');
}

function showLoading() {
  const messagesContainer = document.getElementById('chatMessages');
  
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-message';
  loadingDiv.id = 'loadingIndicator';
  
  loadingDiv.innerHTML = `
    <div class="message-icon">🤖</div>
    <div class="message-content">
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeLoading() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

function showError(message) {
  const messagesContainer = document.getElementById('chatMessages');
  messagesContainer.innerHTML = `
    <div class="message error-message">
      <div class="message-icon">⚠️</div>
      <div class="message-content">
        <p><strong>Error</strong></p>
        <p>${message}</p>
      </div>
    </div>
  `;
}

async function getAIResponse(userMessage) {
  const apiKey = CONFIG.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'OPENAI_API_KEY') {
    throw new Error('Please add your OpenAI API key to config.js');
  }
  
  // Build the conversation with article context
  const messages = [
    {
      role: 'system',
      content: `You are a helpful AI assistant. You have read the following article and can answer questions about it. Format your responses with HTML: use <strong> for important terms, <ul> and <li> for bullet points when appropriate.

Article Title: "${articleTitle}"

Article Content:
${articleContent}

Answer questions based on the article content. Be concise but thorough. If the question is not related to the article, politely redirect the user to ask about the article.`
    },
    ...conversationHistory,
    {
      role: 'user',
      content: userMessage
    }
  ];
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }
  
  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  
  // Add to conversation history
  conversationHistory.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: aiResponse }
  );
  
  return aiResponse;
}