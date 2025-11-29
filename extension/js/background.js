// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explainLikeIm12",
    title: "Explain like I'm 12",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explainLikeIm12") {
    const selectedText = info.selectionText;
    
    // Send message to content script with the selected text
    chrome.tabs.sendMessage(tab.id, {
      action: "explainText",
      text: selectedText
    });
  }
});