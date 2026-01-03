# Chrome Web Store Submission — PR Size Guard

**Extension Type:** Content script only  
**Manifest Version:** 3  
**Remote Code:** None  
**Backend:** None

---

## 1. Required Files

These files **must** be included. Missing any will cause rejection or broken functionality.

| File | Purpose | Rejection Risk if Missing |
|------|---------|---------------------------|
| `manifest.json` | Extension configuration | Immediate rejection |
| `content.js` | Core functionality | Extension non-functional |
| `content.css` | Badge styling | Badge unstyled/broken |
| `popup/popup.html` | Settings UI | Popup fails to open |
| `popup/popup.js` | Settings logic | Settings non-functional |
| `popup/popup.css` | Settings styling | Popup unstyled |
| `icons/icon-16.png` | Toolbar icon (small) | Missing icon warning |
| `icons/icon-48.png` | Extensions page icon | Missing icon warning |
| `icons/icon-128.png` | Store listing icon | **Required for submission** |

---

## 2. Optional but Acceptable Files

These files are allowed but not required.

| File | Notes |
|------|-------|
| `icons/icon-32.png` | Optional size, Chrome will scale from others |
| `icons/icon-64.png` | Optional size |
| `_locales/` folder | Only if you implement i18n (not needed for MVP) |

---

## 3. Files That Must NOT Be Included

| File/Pattern | Reason |
|--------------|--------|
| `.git/` | Version control artifacts |
| `.gitignore` | Dev configuration |
| `.cursorrules` | IDE configuration |
| `.vscode/` | IDE configuration |
| `.idea/` | IDE configuration |
| `*.md` (README, TODO, etc.) | Documentation not needed at runtime |
| `node_modules/` | Build artifacts |
| `package.json` | Build configuration |
| `package-lock.json` | Build configuration |
| `*.log` | Debug artifacts |
| `*.map` | Source maps (exposes source, not needed) |
| `*.ts` | TypeScript source (if using TS) |
| `tsconfig.json` | Build configuration |
| `.env` | Environment variables |
| `test/`, `tests/`, `__tests__/` | Test files |
| `*.test.js`, `*.spec.js` | Test files |
| `.DS_Store` | macOS artifacts |
| `Thumbs.db` | Windows artifacts |
| `ignore/` | Your local folder |
| `*.zip` | Nested archives |
| `STORE_SUBMISSION.md` | This file |

---

## 4. Minimal ZIP Structure

```
pr-size-guard.zip
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

**Total files:** 9  
**Expected ZIP size:** < 50 KB

---

## 5. ZIP Creation Command

```bash
cd /Users/afrasiyabhaider/Sites/personal-projects/chrome/pr-size-guard

zip -r pr-size-guard.zip \
  manifest.json \
  content.js \
  content.css \
  popup/ \
  icons/ \
  -x "*.DS_Store" \
  -x "*/.git/*" \
  -x "*.md"
```

**Verify contents before upload:**
```bash
unzip -l pr-size-guard.zip
```

---

## 6. Chrome Web Store Rejection Checklist

### Manifest Issues

| Check | Status |
|-------|--------|
| `manifest_version` is `3` | ☐ |
| `version` follows semver (e.g., `1.0.0`) | ☐ |
| `name` ≤ 45 characters | ☐ |
| `description` ≤ 132 characters | ☐ |
| No unused permissions declared | ☐ |
| `host_permissions` limited to `github.com/*` only | ☐ |
| No `activeTab` permission (not needed) | ☐ |
| No `tabs` permission (not needed) | ☐ |
| No `scripting` permission (not needed) | ☐ |

### Code Policy Violations

| Check | Status |
|-------|--------|
| No `eval()` anywhere in code | ☐ |
| No `new Function()` anywhere in code | ☐ |
| No inline `<script>` in HTML files | ☐ |
| No remote script loading (`fetch` + execute) | ☐ |
| No obfuscated or minified code that hides intent | ☐ |
| All functionality matches store description | ☐ |

### Icons

| Check | Status |
|-------|--------|
| 128x128 icon exists and is clear | ☐ |
| Icons are PNG format | ☐ |
| Icons render well on dark and light backgrounds | ☐ |
| No transparency issues (solid background preferred) | ☐ |

### Store Listing Requirements

| Check | Status |
|-------|--------|
| Short description provided (≤ 132 chars) | ☐ |
| Detailed description provided | ☐ |
| At least 1 screenshot (1280x800 or 640x400) | ☐ |
| Privacy policy URL provided | ☐ |
| Category selected: Developer Tools | ☐ |
| Primary language set | ☐ |

### Privacy Policy (Minimum Content)

Must include a URL. Can be a GitHub Gist. Minimum text:

```
PR Size Guard Privacy Policy

This extension does not collect, store, or transmit any personal data.
All processing occurs locally in your browser.
No analytics, tracking, or external network requests are made.
User settings are stored locally using Chrome's sync storage.

Contact: [your email]
Last updated: [date]
```

### Functionality Verification

| Check | Status |
|-------|--------|
| Extension loads without errors | ☐ |
| Badge appears on GitHub PR pages | ☐ |
| Badge does NOT appear on non-PR pages | ☐ |
| Settings popup opens and saves | ☐ |
| No console errors in production | ☐ |
| Works after Chrome restart | ☐ |

---

## 7. Common Rejection Reasons (Specific to This Extension)

| Rejection Reason | Prevention |
|------------------|------------|
| "Excessive permissions" | Only request `storage` + `github.com` host |
| "Functionality not working" | Test on real GitHub PRs before submission |
| "Missing privacy policy" | Create Gist with minimal policy |
| "Description doesn't match" | Ensure description matches actual behavior |
| "Broken popup" | Verify popup opens without JS errors |
| "Remote code execution" | No `fetch` + `eval` patterns |

---

## 8. Pre-Submission Final Checks

```bash
# 1. Create clean ZIP
zip -r pr-size-guard.zip manifest.json content.js content.css popup/ icons/ -x "*.DS_Store"

# 2. Test the ZIP (load as unpacked from extracted folder)
mkdir /tmp/extension-test
unzip pr-size-guard.zip -d /tmp/extension-test
# Load /tmp/extension-test in chrome://extensions

# 3. Verify no dev artifacts
unzip -l pr-size-guard.zip | grep -E "\.(md|git|log|env)"
# Should return nothing

# 4. Check file count
unzip -l pr-size-guard.zip | tail -1
# Should show 9 files
```

---

## 9. Submission URL

https://chrome.google.com/webstore/devconsole

**Expected review time:** 1–3 business days  
**Developer fee:** $5 one-time (if first extension)
