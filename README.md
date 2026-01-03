# PR Size Guard

A Chrome extension that shows PR size at a glance on GitHub Pull Request pages.

## Features

- **Instant visibility** — Badge appears directly in the PR header
- **Smart classification** — Small, Medium, Large, or Critical
- **Customizable thresholds** — Adjust limits via extension popup
- **SPA-aware** — Works with GitHub's navigation without page reloads
- **Zero dependencies** — Runs entirely in your browser

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `pr-size-guard` folder
6. Navigate to any GitHub Pull Request page

## Default Thresholds

| Size | Max Files | Max Lines (added + deleted) |
|------|-----------|------------------------------|
| Small | ≤ 5 | ≤ 100 |
| Medium | ≤ 15 | ≤ 400 |
| Large | ≤ 30 | ≤ 1000 |
| Critical | > 30 | > 1000 |

The extension uses the **stricter** of the two metrics. If files say "Medium" but lines say "Large", the badge shows "Large".

## Customization

1. Click the PR Size Guard icon in your Chrome toolbar
2. Adjust the threshold values
3. Click **Save Settings**

Settings sync across devices if you're signed into Chrome.

## Privacy

- No data collection
- No analytics
- No external requests
- All processing happens locally in your browser
- Settings stored via `chrome.storage.sync`

## Development

```bash
# Project structure
pr-size-guard/
├── manifest.json      # Extension manifest (V3)
├── content.js         # Main content script
├── content.css        # Badge styles
├── popup/
│   ├── popup.html     # Settings UI
│   ├── popup.js       # Settings logic
│   └── popup.css      # Settings styles
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### Testing

1. Load the extension in developer mode
2. Navigate to various GitHub PRs
3. Check that the badge appears correctly
4. Test SPA navigation (click between PRs without page reload)
5. Test threshold customization

### Debug Mode

In `content.js`, set `DEBUG = true` to enable console logging.

## License

MIT
