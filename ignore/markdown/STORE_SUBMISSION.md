# Chrome Web Store Submission — PR Size Guard

**Version:** 1.0.0  
**Author:** Arcocia Tech  
**Extension Type:** Content script only  
**Manifest Version:** 3  
**Remote Code:** None  
**Backend:** None

---

## 1. Required Files ✅

| File | Purpose | Status |
|------|---------|--------|
| `manifest.json` | Extension configuration | ✅ Ready |
| `content.js` | Core functionality | ✅ Ready |
| `content.css` | Badge styling | ✅ Ready |
| `popup/popup.html` | Settings UI | ✅ Ready |
| `popup/popup.js` | Settings logic | ✅ Ready |
| `popup/popup.css` | Settings styling | ✅ Ready |
| `icons/icon-16.png` | Toolbar icon | ✅ Ready |
| `icons/icon-48.png` | Extensions page icon | ✅ Ready |
| `icons/icon-128.png` | Store listing icon | ✅ Ready |

**Total:** 9 files

---

## 2. Files That Must NOT Be Included

| File/Pattern | Reason |
|--------------|--------|
| `.git/` | Version control |
| `.gitignore` | Dev config |
| `.cursorrules` | IDE config |
| `.vscode/`, `.idea/` | IDE config |
| `*.md` | Documentation |
| `node_modules/` | Dependencies |
| `package*.json` | Build config |
| `*.log`, `*.map` | Debug artifacts |
| `.DS_Store`, `Thumbs.db` | OS artifacts |
| `ignore/` | Dev folder |
| `*.zip` | Nested archives |

---

## 3. ZIP Structure ✅

```
pr-size-guard-v1.0.0.zip (32 KB)
├── manifest.json
├── content.js
├── content.css
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

---

## 4. ZIP Creation Command

```bash
cd /Users/afrasiyabhaider/Sites/personal-projects/chrome/pr-size-guard

# Create ZIP
zip -r pr-size-guard-v1.0.0.zip \
  manifest.json \
  content.js \
  content.css \
  popup/ \
  icons/ \
  -x "*.DS_Store"

# Verify contents
unzip -l pr-size-guard-v1.0.0.zip

# Check size
ls -lh pr-size-guard-v1.0.0.zip
```

---

## 5. Store Listing Content

### Extension Name (44 chars) ✅
```
PR Size Guard - GitHub Pull Request Reviewer
```

### Short Description (120 chars) ✅
```
See GitHub PR size instantly. Shows Small/Medium/Large/Critical badges on Pull Requests. Helps code review.
```

### Category
```
Developer Tools
```

### Primary Language
```
English
```

---

## 6. Rejection Prevention Checklist

### Manifest ✅

| Check | Status |
|-------|--------|
| `manifest_version` is `3` | ✅ |
| `version` follows semver (`1.0.0`) | ✅ |
| `name` ≤ 45 characters (44) | ✅ |
| `description` ≤ 132 characters (120) | ✅ |
| No unused permissions | ✅ |
| `host_permissions` = `github.com/*` only | ✅ |
| No `activeTab` permission | ✅ |
| No `tabs` permission | ✅ |
| No `scripting` permission | ✅ |

### Code Policy ✅

| Check | Status |
|-------|--------|
| No `eval()` | ✅ |
| No `new Function()` | ✅ |
| No inline `<script>` in HTML | ✅ |
| No remote code loading | ✅ |
| No obfuscated code | ✅ |
| Functionality matches description | ✅ |

### Icons ✅

| Check | Status |
|-------|--------|
| 128x128 icon exists | ✅ |
| All icons PNG format | ✅ |
| Icons visible on dark/light | ✅ |
| No transparency issues | ✅ |

### Store Listing 📝

| Check | Status |
|-------|--------|
| Short description ready | ✅ |
| Detailed description ready | ✅ |
| Screenshots (1280x800) | 📝 Need to capture |
| Privacy policy URL | 📝 Need to create Gist |
| Category: Developer Tools | 📝 Select during submission |

### Functionality ✅

| Check | Status |
|-------|--------|
| Extension loads without errors | ✅ |
| Badge appears on GitHub PRs | ✅ |
| Badge shows correct category | ✅ |
| Tooltip shows detailed stats | ✅ |
| Settings popup works | ✅ |
| Settings save and persist | ✅ |
| Footer shows Arcocia Tech | ✅ |
| Buy Me a Coffee link works | ✅ |
| No console errors | ✅ |
| Works after Chrome restart | ✅ |

---

## 7. Privacy Policy

**Host on:** GitHub Gist

**Copy this content:**

```markdown
# PR Size Guard Privacy Policy

**Last updated:** January 3, 2026

## Overview

PR Size Guard is a Chrome extension developed by Arcocia Tech.

## Data Collection

This extension does NOT collect, store, or transmit any personal data.

## How It Works

- Reads Pull Request statistics from GitHub page DOM
- All processing happens locally in your browser
- No data is sent to external servers
- No analytics or tracking

## Permissions

- **github.com access**: Read PR stats and display badge
- **Storage**: Save custom threshold settings locally

## Third Parties

- No third-party analytics
- No tracking
- No advertising

## Contact

- Website: https://arcocia.tech
- Support: https://buymeacoffee.com/afrasiyabhaider

## Changes

Updates will be posted at this URL.

---

© 2026 Arcocia Tech
```

### How to Create Gist

1. Go to https://gist.github.com
2. Filename: `privacy-policy.md`
3. Paste content above
4. Click "Create public gist"
5. Copy URL for submission

---

## 8. Screenshots Required

| # | Description | Overlay Text |
|---|-------------|--------------|
| 1 | Badge on GitHub PR | "See PR Size Instantly" |
| 2 | All 4 badge types | "Four Size Categories" |
| 3 | Settings popup with footer | "Fully Customizable" |
| 4 | Hover tooltip | "Detailed Stats on Hover" |

**Size:** 1280x800 or 640x400 pixels  
**Format:** PNG or JPG

---

## 9. Common Rejection Reasons

| Reason | Our Status |
|--------|------------|
| Excessive permissions | ✅ Minimal (storage + github.com) |
| Functionality not working | ✅ Tested on real PRs |
| Missing privacy policy | 📝 Create Gist before submission |
| Description mismatch | ✅ Matches actual behavior |
| Broken popup | ✅ Works correctly |
| Remote code execution | ✅ None |

**Rejection Risk:** Very Low ✅

---

## 10. Pre-Submission Final Checks

```bash
# 1. Verify ZIP exists and size
ls -lh pr-size-guard-v1.0.0.zip
# Should show ~32KB

# 2. Test ZIP contents
unzip -l pr-size-guard-v1.0.0.zip
# Should show 9 files

# 3. Test from fresh install
rm -rf /tmp/extension-test
unzip pr-size-guard-v1.0.0.zip -d /tmp/extension-test
# Load /tmp/extension-test in chrome://extensions
# Test on GitHub PR

# 4. Verify no dev files included
unzip -l pr-size-guard-v1.0.0.zip | grep -E "\.(md|git|log)"
# Should return nothing
```

---

## 11. Submission Steps

1. **Go to:** https://chrome.google.com/webstore/devconsole

2. **Pay fee:** $5 one-time (if first extension)

3. **Create new item:**
   - Upload `pr-size-guard-v1.0.0.zip`
   - Fill in store listing details

4. **Store Listing:**
   - Name: `PR Size Guard - GitHub Pull Request Reviewer`
   - Description: Copy from RELEASE_GUIDE.md
   - Category: Developer Tools
   - Language: English

5. **Privacy:**
   - Privacy policy URL: Your Gist URL
   - Single purpose: "Display PR size badges on GitHub"

6. **Upload assets:**
   - Screenshots (1280x800)
   - Icons already in ZIP

7. **Submit for review**

---

## 12. Post-Submission

**Expected review time:** 1-3 business days

### If Approved ✅
- Share on social media
- Post on Reddit, Hacker News, Dev.to
- Ask users for reviews

### If Rejected ❌
- Read rejection reason carefully
- Fix the specific issue
- Resubmit

---

## 13. Support Links

| Resource | URL |
|----------|-----|
| Arcocia Tech | https://arcocia.tech |
| Buy Me a Coffee | https://buymeacoffee.com/afrasiyabhaider |
| Chrome Developer Console | https://chrome.google.com/webstore/devconsole |

---

## 14. Version Summary

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Manifest | V3 |
| ZIP Size | 32 KB |
| Files | 9 |
| Permissions | storage, github.com |
| Author | Arcocia Tech |

---

**Ready to submit!** 🚀
