// This script runs on thehackernews.com pages

console.log('Hacker News Modifier extension loaded!');

// Example 1: Add a custom banner at the top
function addCustomBanner() {
  // Check if banner already exists
  if (document.getElementById('custom-banner')) {
    return;
  }
  
  const banner = document.createElement('div');
  banner.id = 'custom-banner';
  banner.textContent = '🚀 Enhanced by Chrome Extension';
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