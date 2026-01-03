/**
 * PR Size Guard — Background Service Worker
 * Handles keyboard shortcuts and extension toggle
 */

// Default enabled state (must match shared/constants.js ENABLED_DEFAULT)
const ENABLED_DEFAULT = true;

// Listen for keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-extension') {
    await toggleExtension();
  }
});

/**
 * Toggle the extension enabled/disabled state
 */
async function toggleExtension() {
  try {
    const result = await chrome.storage.sync.get('enabled');
    const currentState = result.enabled ?? ENABLED_DEFAULT;
    const newState = !currentState;
    
    await chrome.storage.sync.set({ enabled: newState });
    
    // Notify all GitHub tabs about the state change (parallel for performance)
    const tabs = await chrome.tabs.query({ url: 'https://github.com/*' });
    
    await Promise.allSettled(
      tabs.map(tab => 
        chrome.tabs.sendMessage(tab.id, { 
          type: 'TOGGLE_EXTENSION', 
          enabled: newState 
        })
      )
    );
    
    // Show notification badge on extension icon
    await updateBadge(newState);
    
  } catch (e) {
    console.error('Failed to toggle extension:', e);
  }
}

/**
 * Update the extension icon badge to show enabled/disabled state
 */
async function updateBadge(enabled) {
  if (enabled) {
    await chrome.action.setBadgeText({ text: '' });
  } else {
    await chrome.action.setBadgeText({ text: 'OFF' });
    await chrome.action.setBadgeBackgroundColor({ color: '#6e7781' });
  }
}

// Initialize badge on startup
chrome.storage.sync.get('enabled').then(result => {
  const enabled = result.enabled ?? ENABLED_DEFAULT;
  updateBadge(enabled);
});
