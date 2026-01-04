# Changelog

All notable changes to PR Size Guard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-03

### Added
- PR size badges on Pull Requests list page (`/pulls`)
- Custom badge color settings with color picker
- Keyboard shortcut (Alt+Shift+P) to toggle extension on/off
- Toggle switch in popup header for quick enable/disable
- "OFF" badge indicator on extension icon when disabled
- Build script for automated ZIP creation (`scripts/build.sh`)

### Fixed
- Badge loading delay with targeted MutationObserver
- SPA navigation edge cases with additional event listeners
- GitHub DOM resilience with 15+ fallback selectors

### Improved
- Exponential backoff retry (100-1600ms) for lazy-loaded content
- Auto-disconnect observer after 10s to prevent memory leaks
- Debounced navigation handling for rapid page changes

### Technical
- Added background service worker for command handling
- Storage now includes colors and enabled state
- Better separation of concerns in content script

---

## [1.0.0] - 2026-01-03

### Added
- Initial release
- PR size badge injection on GitHub Pull Request pages
- Four size categories: Small, Medium, Large, Critical
- Customizable thresholds via popup settings
- Detailed tooltip showing files and lines breakdown on hover
- Dark mode support matching GitHub themes
- SPA navigation handling (works without page reload)
- Settings sync across devices via Chrome storage
- Retry logic for slow-loading PR stats
- Fallback "Size: ?" badge when stats unavailable

### Technical
- Manifest V3 compliant
- Minimal permissions (storage + github.com only)
- No external dependencies
- No data collection or analytics
