// This script runs on thehackernews.com pages

console.log('Hacker News Modifier extension loaded!');

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

// Example 2: Highlight certain keywords in articles (FIXED - only text content)
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
          // Skip script, style tags, and already highlighted content
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains('highlight-keyword')) {
            return NodeFilter.FILTER_REJECT;
          }
          // Only process nodes with actual text content
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
    // Skip if already has reading time
    if (articleBox.querySelector('.reading-time')) {
      continue;
    }
    
    // Get the article link
    const link = articleBox.closest('.story-link');
    if (!link) continue;
    
    const articleUrl = link.href;
    let readingTime = 1; // Default
    
    // Check if it's an actual thehackernews.com article
    if (articleUrl.includes('thehackernews.com')) {
      try {
        // Fetch the article page
        const response = await fetch(articleUrl);
        const html = await response.text();
        
        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get all paragraph elements from the article body
        const articleBody = doc.querySelector('.articlebody');
        if (articleBody) {
          const paragraphs = articleBody.querySelectorAll('p');
          let totalText = '';
          paragraphs.forEach(p => {
            totalText += p.textContent + ' ';
          });
          
          // Calculate reading time
          const wordCount = totalText.trim().split(/\s+/).length;
          readingTime = Math.ceil(wordCount / 200);
        }
      } catch (error) {
        console.log('Error fetching article:', error);
      }
    } else {
      // For external links, use the description text
      const descElement = articleBox.querySelector('.home-desc');
      if (descElement) {
        const text = descElement.textContent;
        const wordCount = text.trim().split(/\s+/).length;
        readingTime = Math.max(1, Math.ceil(wordCount / 200));
      }
    }
    
    // Create reading time label
    const timeLabel = document.createElement('div');
    timeLabel.className = 'reading-time';
    timeLabel.textContent = `📖 ${readingTime} min read`;
    
    // Insert into item-label
    const itemLabel = articleBox.querySelector('.item-label');
    if (itemLabel) {
      itemLabel.insertBefore(timeLabel, itemLabel.firstChild);
    }
  }
}

// Example 4: Change link colors for external links
function styleExternalLinks() {
  const links = document.querySelectorAll('a[href^="http"]');
  links.forEach(link => {
    if (!link.href.includes('thehackernews.com') && !link.classList.contains('external-link')) {
      link.classList.add('external-link');
    }
  });
}

// Create the explanation side panel
function createExplanationPanel() {
  if (document.getElementById('explanation-panel')) {
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'explanation-panel';
  panel.innerHTML = `
    <div id="explanation-panel-header">
      <h2>🧠 Explain Like I'm 12</h2>
      <button id="explanation-panel-close">×</button>
    </div>
    <div id="explanation-panel-content">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">Loading explanation...</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Close button functionality
  document.getElementById('explanation-panel-close').addEventListener('click', () => {
    panel.classList.remove('open');
  });
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

// Call OpenAI API to explain the text
async function explainWithChatGPT(selectedText, articleContext) {
  const apiKey = CONFIG.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('Please add your OpenAI API key to config.js');
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
  
  return content;
}

// Show explanation in the side panel
async function showExplanation(selectedText) {
  console.log('showExplanation called with text:', selectedText);
  
  createExplanationPanel();
  
  const panel = document.getElementById('explanation-panel');
  const content = document.getElementById('explanation-panel-content');
  
  console.log('Panel created, showing loading state');
  
  // Show loading state
  content.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">Thinking...</div>
    </div>
  `;
  
  // Open the panel
  panel.classList.add('open');
  
  try {
    // Get article context
    const articleContext = getArticleText();
    console.log('Article context length:', articleContext.length);
    
    // Get explanation from ChatGPT
    console.log('Calling ChatGPT...');
    const explanation = await explainWithChatGPT(selectedText, articleContext);
    console.log('Got explanation:', explanation);
    
    // Display the explanation
    content.innerHTML = `
      <div class="selected-text-box">
        <h3>Selected Text</h3>
        <p>"${selectedText}"</p>
      </div>
      <div class="explanation-box">
        <h3>Simple Explanation</h3>
        <div class="explanation-text">${explanation}</div>
      </div>
    `;
  } catch (error) {
    console.error('Error getting explanation:', error);
    content.innerHTML = `
      <div class="error-box">
        <strong>Error:</strong> ${error.message}
      </div>
    `;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "explainText") {
    showExplanation(request.text);
  }
});

// Run modifications only once
(function() {
  // Check if we've already run by looking for our banner
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