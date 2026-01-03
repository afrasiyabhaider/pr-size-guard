# PR Size Guard

<p align="center">
  <img src="icons/icon-128.png" alt="PR Size Guard Logo" width="128" height="128">
</p>

<p align="center">
  <strong>See GitHub PR size at a glance</strong><br>
  A Chrome extension that shows Pull Request size badges on GitHub.
</p>

<p align="center">
  <a href="https://arcocia.tech">Website</a> •
  <a href="https://buymeacoffee.com/afrasiyabhaider">Support</a> •
  <a href="#installation">Install</a> •
  <a href="#features">Features</a>
</p>

---

## 🎯 What It Does

When you open any Pull Request on GitHub, PR Size Guard automatically displays a **color-coded badge** showing the PR size:

| Badge | Category | Meaning |
|-------|----------|---------|
| 🟢 **Small** | ≤5 files, ≤100 lines | Quick review |
| 🟠 **Medium** | ≤15 files, ≤400 lines | Normal review |
| 🔴 **Large** | ≤30 files, ≤1000 lines | Needs focus |
| ⛔ **Critical** | >30 files or >1000 lines | Consider splitting |

---

## ✨ Features

- **Instant visibility** — Badge appears directly in the PR header
- **Smart classification** — Uses the stricter of files vs lines
- **Detailed tooltip** — Hover to see files, additions, and deletions
- **Customizable thresholds** — Adjust limits via extension popup
- **Dark mode support** — Matches GitHub's themes
- **SPA-aware** — Works with GitHub's navigation without page reloads
- **Zero dependencies** — Runs entirely in your browser
- **Privacy first** — No data collection, no analytics

---

## 📦 Installation

### Chrome Web Store
*(Coming soon)*

### Manual Installation

1. Download or clone this repository
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `pr-size-guard` folder
6. Navigate to any GitHub Pull Request

---

## ⚙️ Configuration

### Default Thresholds

| Size | Max Files | Max Lines |
|------|-----------|-----------|
| Small | ≤ 5 | ≤ 100 |
| Medium | ≤ 15 | ≤ 400 |
| Large | ≤ 30 | ≤ 1000 |
| Critical | > 30 | > 1000 |

### Customize Thresholds

1. Click the **PR Size Guard** icon in your Chrome toolbar
2. Adjust the threshold values for each category
3. Click **Save Settings**

Settings sync across devices if you're signed into Chrome.

---

## 🔒 Privacy

| Check | Status |
|-------|--------|
| Data collection | ❌ None |
| Analytics | ❌ None |
| External requests | ❌ None |
| Tracking | ❌ None |

All processing happens **locally in your browser**. Settings are stored via Chrome's built-in sync storage.

---

## 🛠️ Development

### Project Structure

```
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
2. Navigate to various GitHub PRs:
   - Small PR: < 5 files
   - Large PR: Find a big open-source PR
3. Test SPA navigation (click between PRs)
4. Test threshold customization
5. Test dark mode

### Debug Mode

In `content.js`, set `DEBUG = true` to enable console logging:

```javascript
const DEBUG = true; // Enable for development
```

---

## 📸 Screenshots

| Badge on PR | Settings Popup |
|-------------|----------------|
| Badge appears next to PR title | Customize thresholds easily |

---

## 💡 Why PR Size Matters

Studies show code review quality drops significantly after **~400 lines**. Large PRs:

- ⏱️ Take longer to review
- 🐛 Hide bugs more easily
- 😫 Cause reviewer fatigue
- 🚢 Delay shipping

PR Size Guard helps you identify these PRs **before** you start reviewing.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## ☕ Support

If this extension helps you, consider supporting development:

<a href="https://buymeacoffee.com/afrasiyabhaider" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="200">
</a>

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| Website | [arcocia.tech](https://arcocia.tech) |
| Support | [Buy Me a Coffee](https://buymeacoffee.com/afrasiyabhaider) |
| Chrome Web Store | *Coming soon* |

---

<p align="center">
  Made with ❤️ by <a href="https://arcocia.tech">Arcocia Tech</a>
</p>
