# Changelog

All notable changes to PR Size Guard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
