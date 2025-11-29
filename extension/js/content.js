// This script runs on thehackernews.com pages

console.log('Hacker News Modifier extension loaded!');

// AI Panel state
let conversationHistory = [];
let articleContent = '';
let articleTitle = '';
let panelMode = 'chat'; // 'chat' or 'explain'

// Example 1: Add a custom banner at the top (invisible, used for duplicate check)
function addCustomBanner() {
  // Check if banner already exists
  if (document.getElementById('custom-banner')) {
    return;
  }
  
  const banner = document.createElement('div');
  banner.id = 'custom-banner';
  banner.style.display = 'none'; // Hide the banner
  document.body.insertBefore(banner, document.body.firstChild);
}

// Example 2: Highlight certain keywords in articles
function highlightKeywords() {
  const keywords = ['security', 'privacy', 'AI', 'crypto'];
  
  // Get all text nodes in the body, excluding script/style tags
  function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains('highlight-keyword')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.textContent.trim().length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    return textNodes;
  }
  
  const textNodes = getTextNodes(document.body);
  
  textNodes.forEach(node => {
    let text = node.textContent;
    let modified = false;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      if (regex.test(text)) {
        modified = true;
      }
    });
    
    if (modified) {
      let html = text;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        html = html.replace(regex, '<span class="highlight-keyword">$1</span>');
      });
      
      const span = document.createElement('span');
      span.innerHTML = html;
      node.parentElement.replaceChild(span, node);
    }
  });
}

// Add reading time by fetching the actual article
async function addReadingTime() {
  const articleBoxes = document.querySelectorAll('.home-post-box');
  
  for (const articleBox of articleBoxes) {
    if (articleBox.querySelector('.reading-time')) {
      continue;
    }
    
    const link = articleBox.closest('.story-link');
    if (!link) continue;
    
    const articleUrl = link.href;
    let readingTime = 1;
    
    if (articleUrl.includes('thehackernews.com')) {
      try {
        const response = await fetch(articleUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const articleBody = doc.querySelector('.articlebody');
        
        if (articleBody) {
          const paragraphs = articleBody.querySelectorAll('p');
          let totalText = '';
          paragraphs.forEach(p => {
            totalText += p.textContent + ' ';
          });
          
          const wordCount = totalText.trim().split(/\s+/).length;
          readingTime = Math.ceil(wordCount / 200);
        }
      } catch (error) {
        console.log('Error fetching article:', error);
      }
    } else {
      const descElement = articleBox.querySelector('.home-desc');
      if (descElement) {
        const text = descElement.textContent;
        const wordCount = text.trim().split(/\s+/).length;
        readingTime = Math.max(1, Math.ceil(wordCount / 200));
      }
    }
    
    const timeLabel = document.createElement('div');
    timeLabel.className = 'reading-time';
    timeLabel.textContent = `📖 ${readingTime} min read`;
    
    const itemLabel = articleBox.querySelector('.item-label');
    if (itemLabel) {
      itemLabel.insertBefore(timeLabel, itemLabel.firstChild);
    }
  }
}

// Style external links
function styleExternalLinks() {
  const links = document.querySelectorAll('a[href^="http"]');
  links.forEach(link => {
    if (!link.href.includes('thehackernews.com') && !link.classList.contains('external-link')) {
      link.classList.add('external-link');
    }
  });
}

// Create the unified AI panel
function createAIPanel() {
  if (document.getElementById('ai-panel')) {
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'ai-panel';
  panel.innerHTML = `
    <div id="ai-panel-header">
      <div class="ai-panel-title-section">
        <h2 id="ai-panel-title">🤖 AI Assistant</h2>
        <div class="ai-panel-subtitle" id="ai-panel-subtitle">Ask me anything</div>
      </div>
      <button id="ai-panel-close">×</button>
    </div>
    <div id="ai-panel-content">
      <div id="ai-messages"></div>
    </div>
    <div id="ai-input-container">
      <div class="ai-input-wrapper">
        <textarea 
          id="ai-input" 
          placeholder="Ask a question or request an explanation..."
          rows="1"
        ></textarea>
        <button id="ai-send-btn">
          <span class="ai-send-icon">➤</span>
        </button>
      </div>
      <div class="ai-input-hint">Press Enter to send, Shift+Enter for new line</div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Initialize event listeners
  initializeAIPanel();
}

function initializeAIPanel() {
  const aiInput = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send-btn');
  const closeBtn = document.getElementById('ai-panel-close');
  
  // Close button functionality
  closeBtn.addEventListener('click', () => {
    document.getElementById('ai-panel').classList.remove('open');
  });
  
  // Send message on button click
  sendBtn.addEventListener('click', sendMessage);
  
  // Send message on Enter (but allow Shift+Enter for new line)
  aiInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Auto-resize textarea as user types
  aiInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
  });
}

async function sendMessage() {
  const aiInput = document.getElementById('ai-input');
  const messageText = aiInput.value.trim();
  
  if (!messageText) return;
  
  // Clear input and reset height
  aiInput.value = '';
  aiInput.style.height = 'auto';
  
  // Add user message to chat
  addMessage('user', messageText);
  
  // Show loading indicator
  showLoading();
  
  // Get AI response
  try {
    const response = await getAIResponse(messageText);
    removeLoading();
    addMessage('assistant', response);
  } catch (error) {
    removeLoading();
    addErrorMessage('Error: ' + error.message);
  }
}

function addMessage(type, content) {
  const messagesContainer = document.getElementById('ai-messages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ${type}`;
  
  let icon = '🤖';
  if (type === 'user') icon = '👤';
  if (type === 'system') icon = 'ℹ️';
  
  messageDiv.innerHTML = `
    <div class="ai-message-icon">${icon}</div>
    <div class="ai-message-content">
      ${formatMessageContent(content)}
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  const panelContent = document.getElementById('ai-panel-content');
  panelContent.scrollTop = panelContent.scrollHeight;
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
  const messagesContainer = document.getElementById('ai-messages');
  
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'ai-message loading';
  loadingDiv.id = 'ai-loading-indicator';
  
  loadingDiv.innerHTML = `
    <div class="ai-message-icon">🤖</div>
    <div class="ai-message-content">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
  `;
  
  messagesContainer.appendChild(loadingDiv);
  
  const panelContent = document.getElementById('ai-panel-content');
  panelContent.scrollTop = panelContent.scrollHeight;
}

function removeLoading() {
  const loadingIndicator = document.getElementById('ai-loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

function addErrorMessage(message) {
  const messagesContainer = document.getElementById('ai-messages');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-box';
  errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
  
  messagesContainer.appendChild(errorDiv);
  
  const panelContent = document.getElementById('ai-panel-content');
  panelContent.scrollTop = panelContent.scrollHeight;
}

// Get the full article text
function getArticleText() {
  const articleBody = document.querySelector('.articlebody');
  if (!articleBody) return '';
  
  const paragraphs = articleBody.querySelectorAll('p');
  let text = '';
  paragraphs.forEach(p => {
    text += p.textContent + '\n\n';
  });
  
  return text.trim();
}

// Get article title
function getArticleTitle() {
  const titleElement = document.querySelector('.story-title') || document.querySelector('h1');
  if (titleElement) {
    return titleElement.textContent.trim();
  }
  return 'this article';
}

// Call OpenAI API
async function getAIResponse(userMessage) {
  const apiKey = CONFIG.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('Please add your OpenAI API key to config.js');
  }
  
  // Load article content if not already loaded
  if (!articleContent) {
    articleContent = getArticleText();
    articleTitle = getArticleTitle();
  }
  
  // Build the conversation with article context
  const messages = [
    {
      role: 'system',
      content: `You are a helpful AI assistant. You have read the following article and can answer questions about it. Format your responses with HTML: use <strong> for important terms, <ul> and <li> for bullet points when appropriate.

Article Title: "${articleTitle}"

Article Content:
${articleContent}

Answer questions based on the article content. Be concise but thorough. If the question is not directly related to the article, you can still answer it helpfully, but try to relate it to the article when possible.`
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

// Open panel in chat mode
function openChatMode() {
  createAIPanel();
  panelMode = 'chat';
  
  // Update panel title
  document.getElementById('ai-panel-title').textContent = '🤖 Chat with AI';
  document.getElementById('ai-panel-subtitle').textContent = 'Ask me anything about this article';
  
  // Clear messages and add welcome message
  const messagesContainer = document.getElementById('ai-messages');
  messagesContainer.innerHTML = '';
  
  addMessage('system', '<strong>AI Assistant Ready</strong><br>I\'ve read the article and I\'m ready to answer your questions!');
  
  // Open the panel
  document.getElementById('ai-panel').classList.add('open');
  
  // Focus on input
  setTimeout(() => {
    document.getElementById('ai-input').focus();
  }, 300);
}

// Open panel in explain mode (from context menu)
async function openExplainMode(selectedText) {
  createAIPanel();
  panelMode = 'explain';
  
  // Update panel title
  document.getElementById('ai-panel-title').textContent = '🧠 Explain Like I\'m 12';
  document.getElementById('ai-panel-subtitle').textContent = 'Simple explanation';
  
  // Clear messages and show loading
  const messagesContainer = document.getElementById('ai-messages');
  messagesContainer.innerHTML = '';
  
  // Add selected text box
  const selectedTextBox = document.createElement('div');
  selectedTextBox.className = 'selected-text-box';
  selectedTextBox.innerHTML = `
    <h3>Selected Text</h3>
    <p>"${selectedText}"</p>
  `;
  messagesContainer.appendChild(selectedTextBox);
  
  // Show loading
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-spinner';
  loadingDiv.id = 'ai-loading-indicator';
  loadingDiv.innerHTML = `
    <div class="spinner"></div>
    <div class="loading-text">Thinking...</div>
  `;
  messagesContainer.appendChild(loadingDiv);
  
  // Open the panel
  document.getElementById('ai-panel').classList.add('open');
  
  try {
    // Get explanation
    const explanation = await getExplanation(selectedText);
    
    // Remove loading
    const loading = document.getElementById('ai-loading-indicator');
    if (loading) loading.remove();
    
    // Add explanation as a message
    addMessage('assistant', explanation);
    
  } catch (error) {
    // Remove loading
    const loading = document.getElementById('ai-loading-indicator');
    if (loading) loading.remove();
    
    addErrorMessage(error.message);
  }
}

// Get explanation for selected text
async function getExplanation(selectedText) {
  const apiKey = CONFIG.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('Please add your OpenAI API key to config.js');
  }
  
  const articleContext = getArticleText();
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that explains technical topics in simple, concise terms. Format your response with HTML: use <strong> for important terms, <ul> and <li> for bullet points, and keep explanations brief (3-4 sentences max). Be clear and direct.'
        },
        {
          role: 'user',
          content: `Article context:\n${articleContext}\n\nSelected text: "${selectedText}"\n\nExplain this briefly in simple terms with HTML formatting. Use bold for key terms and bullet points where helpful.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }
  
  const data = await response.json();
  let content = data.choices[0].message.content;
  
  // Remove markdown code blocks if present
  content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Add this explanation to conversation history so user can ask follow-ups
  conversationHistory.push(
    { role: 'user', content: `Explain this: "${selectedText}"` },
    { role: 'assistant', content: content }
  );
  
  return content;
}

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "explainText") {
    openExplainMode(request.text);
  } else if (request.action === "openChat") {
    openChatMode();
  }
});

// Run modifications only once
(function() {
  if (document.getElementById('custom-banner')) {
    console.log('Extension already initialized, skipping...');
    return;
  }
  
  console.log('Running extension modifications...');
  addCustomBanner();
  highlightKeywords();
  addReadingTime();
  styleExternalLinks();
})();