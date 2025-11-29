# Hacker News Modifier Chrome Extension

A simple Chrome extension that modifies the appearance and functionality of thehackernews.com.

## Features

- **Custom Banner**: Adds a colorful banner at the top of the page
- **Keyword Highlighting**: Highlights important keywords like "security", "privacy", "AI", and "crypto"
- **Reading Time Estimates**: Adds estimated reading time for articles
- **External Link Styling**: Styles external links in green for easy identification

## Installation

1. Open Google Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked"
4. Select the folder containing this extension's files
5. The extension should now be installed and active!

## Testing

1. Visit https://thehackernews.com
2. You should see the modifications applied automatically

## Customization

You can easily customize this extension:

- **Change keywords**: Edit the `keywords` array in `content.js`
- **Modify styles**: Edit `styles.css` to change colors, fonts, etc.
- **Add new features**: Add more functions to `content.js`

## Files

- `manifest.json` - Extension configuration
- `content.js` - JavaScript that runs on the website
- `styles.css` - Custom CSS styles
- `README.md` - This file

## Notes

- This extension only runs on thehackernews.com
- No data is collected or sent anywhere
- All modifications happen locally in your browser
