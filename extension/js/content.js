// This script runs on thehackernews.com pages

console.log('Hacker News Modifier extension loaded!');

// Safety check for CONFIG
if (typeof CONFIG === 'undefined') {
  console.error('❌ CONFIG not loaded! Check that config.js exists and is listed in manifest.json BEFORE content.js');
  console.error('Expected location: extension/js/config.js');
  console.error('Manifest should have: "js": ["js/config.js", "js/content.js"]');
  
  // Create a dummy CONFIG to prevent crashes
  window.CONFIG = {
    OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY_HERE'
  };
  
  // Show visible error on page
  const errorBanner = document.createElement('div');
  errorBanner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff4444;
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 999999;
    font-family: monospace;
  `;
  errorBanner.innerHTML = '⚠️ Extension Error: config.js not loaded. Check console for details.';
  document.body.insertBefore(errorBanner, document.body.firstChild);
} else {
  console.log('✅ CONFIG loaded successfully');
}

// AI Panel state
let conversationHistory = [];
let articleContent = '';
let articleTitle = '';
let panelMode = 'chat'; // 'chat' or 'explain'
let summaryLevel = 1; // 0 = no summary, 1 = medium, 2 = brief
let articleSummary = null; // Cache the summary

// Load summary level from storage
chrome.storage.sync.get(['summaryLevel'], function(result) {
  summaryLevel = result.summaryLevel !== undefined ? result.summaryLevel : 1;
  console.log('Summary level loaded:', summaryLevel);
  
  // Apply summary if we're on an article page
  if (isArticlePage()) {
    applyArticleSummary();
  }
});

// Listen for summary level changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes.summaryLevel) {
    summaryLevel = changes.summaryLevel.newValue;
    console.log('Summary level changed to:', summaryLevel);
    
    // Re-apply summary with new level
    if (isArticlePage()) {
      applyArticleSummary();
    }
  }
});

// Check if current page is an article page
function isArticlePage() {
  return window.location.pathname.includes('/2025/') && 
         document.querySelector('.articlebody') !== null;
}

// Apply article summary based on current level
async function applyArticleSummary() {
  // Remove existing summary if present
  const existingSummary = document.getElementById('ai-article-summary');
  if (existingSummary) {
    existingSummary.remove();
  }
  
  // If level is 0 (no summary), just return
  if (summaryLevel === 0) {
    console.log('No summary mode - showing full article');
    return;
  }
  
  // Get article content
  const articleBody = document.querySelector('.articlebody');
  if (!articleBody) {
    console.log('Article body not found');
    return;
  }
  
  articleTitle = getArticleTitle();
  articleContent = getArticleText();
  
  if (!articleContent || articleContent.trim().length === 0) {
    console.log('No article content to summarize');
    return;
  }
  
  // Create summary container
  const summaryContainer = document.createElement('div');
  summaryContainer.id = 'ai-article-summary';
  summaryContainer.style.cssText = `
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-left: 4px solid #667eea;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `;
  
  // Show loading state - FIXED: Check for level 2 first
  summaryContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
      "></div>
      <div style="color: #667eea; font-weight: 600;">
        ${summaryLevel === 2 ? '⚡ Generating Brief Summary...' : '📝 Generating Medium Summary...'}
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  // Insert before article body
  articleBody.parentNode.insertBefore(summaryContainer, articleBody);
  
  try {
    // Generate summary
    const summary = await generateArticleSummary(articleContent, articleTitle, summaryLevel);
    articleSummary = summary;
    
    // Update container with summary - FIXED: Check for level 2 first
    summaryContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <span style="font-size: 24px;">${summaryLevel === 2 ? '⚡' : '📝'}</span>
        <h3 style="margin: 0; color: #667eea; font-size: 18px; font-weight: 700;">
          ${summaryLevel === 2 ? 'Brief Summary' : 'Medium Summary'}
        </h3>
      </div>
      <div style="color: #2d3748; line-height: 1.8; font-size: 15px;">
        <style>
          #ai-article-summary strong {
            color: #667eea;
            font-weight: 700;
            background: rgba(102, 126, 234, 0.1);
            padding: 2px 4px;
            border-radius: 3px;
          }
          #ai-article-summary ul {
            margin: 12px 0;
            padding-left: 20px;
          }
          #ai-article-summary li {
            margin: 8px 0;
            line-height: 1.7;
          }
          #ai-article-summary p {
            margin: 10px 0;
          }
          #ai-article-summary p:first-child {
            margin-top: 0;
          }
        </style>
        ${summary}
      </div>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(102, 126, 234, 0.2);">
        <button id="read-full-article-btn" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">
          📖 Read Full Article
        </button>
      </div>
    `;
    
    // Add click handler for "Read Full Article" button
    document.getElementById('read-full-article-btn').addEventListener('click', function() {
      summaryContainer.remove();
      articleBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    
    // Add hover effect
    const btn = document.getElementById('read-full-article-btn');
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
    });
    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    });
    
  } catch (error) {
    console.error('Error generating summary:', error);
    summaryContainer.innerHTML = `
      <div style="color: #d33; font-weight: 600;">
        ⚠️ Error generating summary: ${error.message}
      </div>
      <div style="margin-top: 12px;">
        <button id="retry-summary-btn" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        ">
          🔄 Retry
        </button>
      </div>
    `;
    
    const retryBtn = document.getElementById('retry-summary-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', function() {
        applyArticleSummary();
      });
    }
  }
}

// Generate article summary using GPT - FIXED: Check level 2 first
async function generateArticleSummary(content, title, level) {
  const apiKey = CONFIG.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('Please add your OpenAI API key to config.js');
  }
  
  // Determine summary instructions based on level - FIXED ORDER
  let summaryInstructions;
  let maxTokens;
  
  if (level === 2) {
    // Brief summary (level === 2)
    summaryInstructions = `Create a concise summary (approximately 50-75 words).

Focus on the absolute most important information.

FORMATTING REQUIREMENTS:
- Use <strong> tags to highlight the most critical terms and key points
- Use bullet points (<ul><li>) if there are multiple key points (2-3 max)
- If it's a single topic, use a short paragraph with highlighted key terms
- Make the most important information stand out visually

Be concise but make sure key information is highlighted with <strong> tags.`;
    maxTokens = 250;
  } else {
    // Medium summary (level === 1)
    summaryInstructions = `Create a well-formatted summary of this article (approximately 150-200 words).

Structure your response as:
1. Start with a brief overview paragraph (2-3 sentences)
2. Follow with bullet points for key findings/points
3. End with implications or conclusion

FORMATTING REQUIREMENTS:
- Use <strong> tags to highlight: important names, technical terms, key statistics, and critical concepts
- Use <ul> and <li> tags for bullet points (aim for 3-5 bullets)
- Use <p> tags for paragraphs
- Make it scannable and easy to read
- Highlight the most important information

Example structure:
<p>Brief overview with <strong>key terms</strong> highlighted...</p>
<ul>
<li><strong>First key point:</strong> explanation</li>
<li><strong>Second key point:</strong> explanation</li>
<li><strong>Third key point:</strong> explanation</li>
</ul>
<p>Conclusion with <strong>implications</strong>...</p>`;
    maxTokens = 500;
  }
  
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
          content: `You are a skilled cybersecurity journalist who creates clear, scannable summaries. 

CRITICAL FORMATTING RULES:
1. Use <strong> tags LIBERALLY to highlight:
   - Company names, product names, software names
   - Specific CVE numbers, version numbers, technical identifiers
   - Important statistics, percentages, numbers
   - Key technical terms (like "zero-day", "ransomware", "vulnerability")
   - Critical actions or recommendations
   
2. Use bullet points (<ul><li>) for lists of multiple items

3. Make summaries SCANNABLE - a reader should understand the key points just by reading the bold text

4. Every important name, number, or technical term should be in <strong> tags

5. Structure clearly with paragraphs and bullets for easy reading`
        },
        {
          role: 'user',
          content: `Article Title: "${title}"\n\nArticle Content:\n${content}\n\n${summaryInstructions}`
        }
      ],
      temperature: 0.5,
      max_tokens: maxTokens
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate summary');
  }
  
  const data = await response.json();
  let summary = data.choices[0].message.content;
  
  // Clean up markdown code blocks if present
  summary = summary.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
  
  return summary;
}

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
  
  // Convert markdown bold (**text**) to HTML (<strong>text</strong>)
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
  // Add this explanation to conversation history so user can ask follow-ups
  conversationHistory.push(
    { role: 'user', content: `Explain this: "${selectedText}"` },
    { role: 'assistant', content: content }
  );
  
  return content;
}

// Filter homepage articles based on user preferences
async function filterArticles() {
  console.log('=== FILTER ARTICLES DEBUG START ===');
  
  const isHomepage = window.location.pathname === '/' || 
                     window.location.pathname === '' ||
                     window.location.href === 'https://thehackernews.com/';
  
  console.log('1. Is homepage?', isHomepage);
  console.log('2. Current pathname:', window.location.pathname);
  console.log('3. Current href:', window.location.href);
  
  if (!isHomepage) {
    console.log('❌ Not homepage, exiting filter');
    return;
  }
  
  const stored = await chrome.storage.sync.get(['userId']);
  console.log('4. Stored data:', stored);
  console.log('5. userId:', stored.userId);
  
  if (!stored.userId) {
    console.log('❌ No userId found, exiting filter');
    return;
  }
  
  // Define normalizeUrl BEFORE the try block
  const normalizeUrl = (url) => {
    return url.split('?')[0].replace(/\/$/, '');
  };
  
  try {
    const apiUrl = `http://127.0.0.1:5000/articles?userId=${stored.userId}&limit=50`;
    console.log('6. Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('7. Response status:', response.status);
    
    const articles = await response.json();
    console.log('8. Articles received:', articles.length);
    console.log('9. First article:', articles[0]);
    
    const recommendedLinks = new Set(articles.map(a => normalizeUrl(a.link)));
    console.log('10. Recommended links (normalized):', Array.from(recommendedLinks).slice(0, 3));
    console.log('10b. ALL recommended links:', Array.from(recommendedLinks));

    const allLinks = document.querySelectorAll('a.story-link');
    console.log('11. Total story links found on page:', allLinks.length);
    
    if (allLinks.length === 0) {
      console.log('❌ No story links found! Selector might be wrong.');
      console.log('Available link classes:', Array.from(document.querySelectorAll('a')).slice(0, 5).map(a => a.className));
    }
    
    let shownCount = 0;
    let hiddenCount = 0;

    allLinks.forEach((link, index) => {
      const normalizedHref = normalizeUrl(link.href);
      const isRecommended = recommendedLinks.has(normalizedHref);
      
      if (index < 3) {
        console.log(`12. Link ${index}: ${normalizedHref} - Recommended: ${isRecommended}`);
      }
      
      if (isRecommended) {
        link.style.display = '';
        shownCount++;
      } else {
        link.style.display = 'none';
        hiddenCount++;
        const section = link.closest('section.body-post');
        if (section) section.style.display = 'none';
      }
    });
    
    console.log('13. Shown:', shownCount, 'Hidden:', hiddenCount);
    
    // Add banner
    const banner = document.createElement('div');
    banner.id = 'filter-banner';
    banner.style.cssText = 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-align: center; padding: 12px; font-weight: 600; position: sticky; top: 0; z-index: 9998;';
    banner.innerHTML = `✨ Personalized Feed: Showing ${articles.length} articles <button id="disable-filter" style="margin-left: 15px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 12px; border-radius: 4px; cursor: pointer;">Show All</button>`;
    document.body.insertBefore(banner, document.body.firstChild);
    
    console.log('14. Banner added');
    
    document.getElementById('disable-filter').onclick = () => {
      document.querySelectorAll('a.story-link, section.body-post').forEach(el => el.style.display = '');
      banner.remove();
      console.log('15. Filter disabled');
    };
    
    console.log('=== FILTER ARTICLES DEBUG END ===');
  } catch (error) {
    console.error('❌ Filter error:', error);
    console.error('Error stack:', error.stack);
  }
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
  //highlightKeywords();
  addReadingTime();
  styleExternalLinks();

  // Run article filtering on homepage
  filterArticles();
  
  // Apply article summary if on article page
  if (isArticlePage()) {
    // Wait a bit for page to fully load
    setTimeout(() => {
      applyArticleSummary();
    }, 500);
  }
})();