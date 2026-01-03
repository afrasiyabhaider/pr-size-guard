# PR Size Guard — Execution Plan

**Timeline:** 3–5 days  
**Type:** Chrome Extension (Manifest V3)  
**Target:** GitHub Pull Request pages only

---

## MVP Scope

### In Scope
- Detect PR stats (files changed, lines added, lines deleted)
- Classify PR size: Small / Medium / Large / Dangerous
- Inject a visual badge into GitHub PR header
- Persist user-configurable thresholds via `chrome.storage.sync`
- Handle GitHub SPA navigation (no page reloads)

### Out of Scope (Hard No)
- No AI/ML features
- No GitLab/Bitbucket support
- No team/org features
- No CI/CD integration
- No backend/auth/analytics
- No notifications or alerts

---

## Threshold Logic

Default thresholds (configurable by user):

| Label     | Files Changed | Lines Changed (added + deleted) |
|-----------|---------------|----------------------------------|
| Small     | ≤ 5           | ≤ 100                            |
| Medium    | ≤ 15          | ≤ 400                            |
| Large     | ≤ 30          | ≤ 1000                           |
| Dangerous | > 30          | > 1000                           |

**Classification Rule:**  
Use the *worse* of the two metrics. If files say "Medium" but lines say "Large", the PR is "Large".

---

## Technical Architecture

```
pr-size-guard/
├── manifest.json          # Extension manifest (V3)
├── content.js             # Main content script
├── content.css            # Badge styles
├── popup/
│   ├── popup.html         # Settings UI
│   ├── popup.js           # Settings logic
│   └── popup.css          # Settings styles
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md
```

### Key Technical Decisions

| Concern | Decision |
|---------|----------|
| Manifest version | V3 (required for Chrome Web Store) |
| Script type | Content script (no service worker needed for MVP) |
| Storage | `chrome.storage.sync` (syncs across devices) |
| SPA handling | MutationObserver + URL change detection |
| Styling | Scoped CSS with unique prefix to avoid conflicts |

---

## DOM Strategy for GitHub

### Target URL Pattern
```
https://github.com/**/pull/*
```

### PR Stats Location
GitHub displays PR stats in the **"Files changed" tab header** and in the **PR header area**:

```
Conversation | Commits | Checks | Files changed (N)
```

Stats are also in the diff bar:
```
Showing N changed files with X additions and Y deletions.
```

### Badge Injection Point
Inject badge **after the PR title** in the header:
```html
<h1 class="gh-header-title">
  <span>PR Title</span>
  <!-- INJECT HERE -->
  <span class="pr-size-guard-badge pr-size-guard--large">Large</span>
</h1>
```

### Selector Strategy

| Element | Primary Selector | Fallback Strategy |
|---------|------------------|-------------------|
| PR page detection | URL match `/pull/\d+` | — |
| Files changed count | `#files_tab_counter` | Parse from tab text |
| Additions | `.diffstat .color-fg-success` | Parse from diff bar text |
| Deletions | `.diffstat .color-fg-danger` | Parse from diff bar text |
| Injection target | `.gh-header-title` | `.js-issue-title` parent |

### SPA Navigation Handling

GitHub uses Turbo (formerly Turbolinks). Detection approach:

1. **MutationObserver** on `<body>` for subtree changes
2. **URL polling** via `setInterval` (fallback, 500ms)
3. **Debounce** badge injection to avoid flicker

```javascript
// Pseudocode
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    handleNavigation();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
```

---

## Execution Phases

### Phase 1: Project Setup (Day 1 — 2 hours)

**Goal:** Scaffold extension, load in Chrome, verify content script runs.

**Files:**
- `manifest.json`
- `content.js` (console.log only)
- `icons/` (placeholder or simple generated icons)

**Key Implementation Notes:**
- Use `"matches": ["https://github.com/*/pull/*"]` in manifest
- Set `"run_at": "document_idle"` for stability
- Add `"all_frames": false` (main frame only)

**Verification:**
- Load unpacked extension in `chrome://extensions`
- Navigate to any GitHub PR
- Confirm console.log appears

---

### Phase 2: Stats Extraction (Day 1–2 — 4 hours)

**Goal:** Reliably extract files changed, additions, and deletions.

**Files:**
- `content.js`

**Key Implementation Notes:**

```javascript
function extractPRStats() {
  // Primary: Parse from diffstat element
  const diffstat = document.querySelector('.diffstat');
  if (!diffstat) return null;
  
  const text = diffstat.textContent; // "42 additions, 15 deletions"
  const additions = parseInt(text.match(/(\d+)\s+addition/)?.[1] || '0');
  const deletions = parseInt(text.match(/(\d+)\s+deletion/)?.[1] || '0');
  
  // Files count from tab counter
  const filesTab = document.querySelector('#files_tab_counter');
  const filesChanged = parseInt(filesTab?.textContent?.trim() || '0');
  
  return { filesChanged, additions, deletions };
}
```

**Edge Cases:**
- PR with 0 files (draft, empty)
- Stats not yet loaded (GitHub lazy loads)
- Renamed files (count as 1 change, 0 lines)

**Mitigation:**
- Retry extraction with exponential backoff (max 3 attempts)
- Return `null` if stats unavailable; don't inject badge

---

### Phase 3: Badge Injection (Day 2 — 3 hours)

**Goal:** Inject styled badge into PR header.

**Files:**
- `content.js`
- `content.css`

**Key Implementation Notes:**

```css
/* Scoped to avoid GitHub style conflicts */
.pr-size-guard-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  vertical-align: middle;
}

.pr-size-guard--small { background: #2ea44f; color: #fff; }
.pr-size-guard--medium { background: #f0883e; color: #fff; }
.pr-size-guard--large { background: #cf222e; color: #fff; }
.pr-size-guard--dangerous { background: #8b0000; color: #fff; animation: pulse 1.5s infinite; }
```

**Injection Logic:**
```javascript
function injectBadge(label) {
  // Remove existing badge first
  document.querySelector('.pr-size-guard-badge')?.remove();
  
  const header = document.querySelector('.gh-header-title');
  if (!header) return;
  
  const badge = document.createElement('span');
  badge.className = `pr-size-guard-badge pr-size-guard--${label.toLowerCase()}`;
  badge.textContent = label;
  badge.title = 'PR Size Guard: Estimated review complexity';
  
  header.appendChild(badge);
}
```

---

### Phase 4: SPA Navigation Handling (Day 2–3 — 3 hours)

**Goal:** Re-inject badge when navigating between PRs without page reload.

**Files:**
- `content.js`

**Key Implementation Notes:**

```javascript
function init() {
  // Initial injection
  attemptBadgeInjection();
  
  // Watch for SPA navigation
  let currentUrl = location.href;
  
  const observer = new MutationObserver(debounce(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      if (isPRPage()) {
        attemptBadgeInjection();
      }
    }
  }, 300));
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

function isPRPage() {
  return /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(location.href);
}

function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
```

**Edge Cases:**
- Switching tabs within PR (Conversation → Files changed)
- Opening PR from list view
- Using browser back/forward

---

### Phase 5: Settings Popup (Day 3 — 3 hours)

**Goal:** Allow users to customize thresholds.

**Files:**
- `popup/popup.html`
- `popup/popup.js`
- `popup/popup.css`
- Update `manifest.json` (add `action` field)

**Key Implementation Notes:**

```html
<!-- popup.html -->
<form id="settings-form">
  <fieldset>
    <legend>Small PR</legend>
    <label>Max files: <input type="number" name="small_files" min="1"></label>
    <label>Max lines: <input type="number" name="small_lines" min="1"></label>
  </fieldset>
  <!-- Repeat for Medium, Large -->
  <button type="submit">Save</button>
</form>
```

```javascript
// popup.js
const DEFAULTS = {
  small: { files: 5, lines: 100 },
  medium: { files: 15, lines: 400 },
  large: { files: 30, lines: 1000 }
};

document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const thresholds = extractFormValues();
  chrome.storage.sync.set({ thresholds });
});

// Load saved settings on popup open
chrome.storage.sync.get('thresholds', ({ thresholds }) => {
  populateForm(thresholds || DEFAULTS);
});
```

**Content Script Integration:**
```javascript
// In content.js
async function getThresholds() {
  const { thresholds } = await chrome.storage.sync.get('thresholds');
  return thresholds || DEFAULTS;
}
```

---

### Phase 6: Polish & Testing (Day 4 — 4 hours)

**Goal:** Handle edge cases, test on real PRs, fix bugs.

**Testing Checklist:**
- [ ] Small PR (< 5 files, < 100 lines)
- [ ] Medium PR
- [ ] Large PR
- [ ] Dangerous PR (find a big OSS PR)
- [ ] PR with only renames
- [ ] Draft PR
- [ ] Merged PR
- [ ] Closed PR
- [ ] Navigate PR → PR without reload
- [ ] Navigate PR → non-PR → PR
- [ ] Refresh page on PR
- [ ] Settings persistence across sessions

**Test PRs (Real Examples):**
- Small: Any typo fix PR
- Large: https://github.com/facebook/react/pulls (filter by size)

---

### Phase 7: Packaging (Day 5 — 2 hours)

**Goal:** Prepare for Chrome Web Store submission.

**Files:**
- `README.md`
- Final icons (128x128 required for store)
- Screenshots (1280x800 recommended)

**Store Requirements:**
- Description (up to 132 chars for short, 16k for full)
- At least 1 screenshot
- Privacy policy URL (can use GitHub gist for simple "no data collected")
- Category: Developer Tools

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GitHub DOM changes | High | Medium | Use semantic selectors, add fallbacks, monitor for breakage |
| Stats not loaded when script runs | Medium | Low | Retry with backoff, MutationObserver on stats area |
| CSS conflicts with GitHub | Low | Low | Prefix all classes with `pr-size-guard-` |
| Extension review delays | Medium | Low | Keep permissions minimal, no remote code |
| SPA navigation misses | Medium | Medium | Combine MutationObserver + URL polling |

### Selector Stability Strategy
GitHub uses React with generated class names. Prefer:
1. IDs (`#files_tab_counter`) — most stable
2. Data attributes (`[data-tab-item="files"]`)
3. Semantic structure (`.gh-header-title`)
4. Avoid: Generated classes like `css-1a2b3c`

---

## Post-MVP Ideas (v1.1+)

> **Note:** Do NOT implement these in MVP. Document for future reference only.

### Potential Enhancements
1. **Detailed tooltip** — Show exact breakdown (files/additions/deletions)
2. **Badge on PR list** — Show size on `/pulls` list view
3. **Keyboard shortcut** — Toggle badge visibility
4. **Custom labels** — Let users rename "Dangerous" to "Needs Split"
5. **Threshold presets** — "Strict", "Relaxed", "Custom"
6. **Dark mode support** — Detect GitHub theme, adjust colors

### v2.0 Considerations (if demand exists)
- Firefox support (requires manifest v2 port)
- Badge history (local storage only, no backend)
- Export settings as JSON

---

## Quick Reference

### Manifest V3 Essentials
```json
{
  "manifest_version": 3,
  "name": "PR Size Guard",
  "version": "1.0.0",
  "description": "Shows PR size at a glance",
  "permissions": ["storage"],
  "host_permissions": ["https://github.com/*"],
  "content_scripts": [{
    "matches": ["https://github.com/*/pull/*"],
    "js": ["content.js"],
    "css": ["content.css"],
    "run_at": "document_idle"
  }],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

### Daily Breakdown

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Setup + Stats extraction | Extension loads, stats logged |
| 2 | Badge injection + SPA handling | Badge visible, survives navigation |
| 3 | Settings popup | User can customize thresholds |
| 4 | Testing + bug fixes | Stable on real PRs |
| 5 | Polish + packaging | Ready for store submission |

---

## Definition of Done (MVP)

- [ ] Badge appears on any GitHub PR page
- [ ] Badge shows correct size classification
- [ ] Badge persists through SPA navigation
- [ ] User can customize thresholds via popup
- [ ] No console errors on GitHub
- [ ] Works on Chrome 120+
- [ ] README with install instructions
