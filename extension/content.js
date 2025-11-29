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

// Example 3: Add reading time estimates
function addReadingTime() {
  // More specific selector for article bodies
  const articles = document.querySelectorAll('.body-post');
  
  articles.forEach(article => {
    // Check if we already added reading time by looking for the element
    const parent = article.parentElement;
    if (!parent) return;
    
    // Check if previous sibling is already a reading time label
    const prevSibling = article.previousElementSibling;
    if (prevSibling && prevSibling.classList.contains('reading-time')) {
      return; // Already added
    }
    
    const text = article.textContent;
    const wordCount = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    const timeLabel = document.createElement('div');
    timeLabel.className = 'reading-time';
    timeLabel.textContent = `📖 ${readingTime} min read`;
    
    // Insert before the article
    parent.insertBefore(timeLabel, article);
  });
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