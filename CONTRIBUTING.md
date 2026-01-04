# Contributing to PR Size Guard

First off, thank you for considering contributing to PR Size Guard! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

**Great bug reports include:**
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (Chrome version, OS, extension version)

### 💡 Suggesting Features

Feature requests are welcome! Please:
- Check if the feature has already been requested
- Describe the problem your feature would solve
- Propose your solution
- Consider the scope (keep it focused)

### 🔧 Contributing Code

1. Look for issues labeled `good first issue` or `help wanted`
2. Comment on the issue to express interest
3. Wait for assignment before starting work
4. Follow the pull request process below

## Development Setup

### Prerequisites

- Google Chrome browser
- Git
- A code editor (VS Code recommended)

### Getting Started

1. **Fork the repository**
   ```bash
   # Click 'Fork' button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pr-size-guard.git
   cd pr-size-guard
   ```

3. **Load the extension**
   - Open Chrome → `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `pr-size-guard` folder

4. **Make changes**
   - Edit the source files
   - Click refresh on the extension card to reload
   - Test on GitHub PR pages

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
└── icons/             # Extension icons
```

## Pull Request Process

### Before Submitting

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Keep changes focused and minimal
   - Follow the style guide
   - Test thoroughly

3. **Test your changes**
   - [ ] Badge appears correctly on PR pages
   - [ ] Tooltip shows correct information
   - [ ] Settings save and load properly
   - [ ] Works with GitHub dark mode
   - [ ] Works after SPA navigation
   - [ ] No console errors

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   
   Use conventional commit messages:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `style:` formatting
   - `refactor:` code restructuring
   - `test:` adding tests
   - `chore:` maintenance

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Use the PR template
   - Link related issues
   - Add screenshots if applicable

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

## Style Guide

### JavaScript

- Use `'use strict'` mode
- Use `const` and `let`, never `var`
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused

```javascript
/**
 * Classify PR size based on stats
 * @param {Object} stats - PR statistics
 * @returns {string} - Size category
 */
function classify(stats) {
  // Implementation
}
```

### CSS

- Prefix all classes with `pr-size-guard-`
- Use CSS custom properties for theming
- Support both light and dark modes

```css
.pr-size-guard-badge {
  /* styles */
}
```

### Commits

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Keep the first line under 72 characters

## Questions?

Feel free to [open a discussion](https://github.com/AfraSiyab/pr-size-guard/discussions) if you have questions!

---

Thank you for contributing! ❤️
