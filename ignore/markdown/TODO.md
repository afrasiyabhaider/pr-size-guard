# PR Size Guard — TODO (Production-Ready)

**Target:** MVP in 3–5 days  
**Status:** 🟡 In Progress  
**Version:** 1.0.0

---

## Phase 1: Project Setup (Day 1)

### Manifest Configuration
- [ ] Create `manifest.json` (Manifest V3)
- [ ] Set `"run_at": "document_idle"` — ensures DOM is ready, reduces race conditions
- [ ] Set `"all_frames": false"` — main frame only, avoids iframe conflicts
- [ ] Minimize permissions:
  ```json
  "permissions": ["storage"]
  "host_permissions": ["https://github.com/*"]
  ```
- [ ] Omit `activeTab`, `tabs`, `scripting` — not needed, reduces review friction

> **Why:** Chrome Web Store reviewers flag excessive permissions. Minimal permissions = faster approval.

### File Structure
- [ ] Create `content.js` (no console.log in production — use only during dev)
- [ ] Create `content.css`
- [ ] Create `icons/` with icons: 16, 48, 128px (PNG, no transparency issues)
- [ ] Create `popup/` folder structure

### Verification
- [ ] Load unpacked in `chrome://extensions`
- [ ] Navigate to GitHub PR — no console errors
- [ ] Extension icon visible in toolbar

---

## Phase 2: Stats Extraction (Day 1–2)

### Selector Strategy

Use **priority-ordered selector lists** with fallbacks. GitHub changes DOM frequently.

```javascript
const SELECTORS = {
  filesCount: [
    '#files_tab_counter',                          // Primary: tab counter
    '[data-tab-item="files"] .Counter',            // Fallback: data attribute
    '.tabnav-tab:contains("Files") .Counter'       // Last resort: text match
  ],
  diffStats: [
    '.diffstat',                                   // Primary: diff stats bar
    '#diffstat',                                   // Fallback: ID variant
    '.js-diff-progressive-container .diffstat'    // Nested container
  ],
  additions: [
    '.diffstat .color-fg-success',                 // Primary: green text
    '.diffstat .text-green',                       // Legacy class
    '.diffstat span:first-child'                   // Structure-based
  ],
  deletions: [
    '.diffstat .color-fg-danger',                  // Primary: red text
    '.diffstat .text-red',                         // Legacy class
    '.diffstat span:last-child'                    // Structure-based
  ]
};
```

### Extraction Logic
- [ ] Write `extractPRStats()` with selector priority iteration
- [ ] Parse text robustly: strip commas, handle "1,234" format
- [ ] Return `null` if extraction fails — do NOT guess

### Retry Strategy
- [ ] Implement retry with backoff: 100ms → 300ms → 600ms (max 3 attempts)
- [ ] Use `requestAnimationFrame` for timing — more reliable than `setTimeout`
- [ ] Fail gracefully after retries exhausted

### Edge Cases
- [ ] PR with 0 changes → return `{ files: 0, additions: 0, deletions: 0 }`
- [ ] Stats container missing → return `null`, trigger fallback badge
- [ ] Non-numeric text found → return `null`

**Verification:** Stats extracted correctly OR graceful failure state triggered

---

## Phase 3: Badge Injection (Day 2)

### Injection Target Selectors

```javascript
const INJECTION_TARGETS = [
  '.gh-header-title',                    // Primary: PR title container
  '.js-issue-title',                     // Fallback: issue/PR title
  '[data-testid="issue-title"]',         // React test ID (if present)
  '.gh-header-show h1'                   // Structure-based fallback
];
```

### Classification Logic
- [ ] Write `classifyPR(stats, thresholds)` — pure function, no DOM access
- [ ] Use **worse of two metrics** rule (files vs lines)
- [ ] Return enum: `'small' | 'medium' | 'large' | 'dangerous' | 'unavailable'`

### Badge States
- [ ] `small` — green (`#2ea44f`)
- [ ] `medium` — orange (`#d29922`)
- [ ] `large` — red (`#cf222e`)
- [ ] `dangerous` — dark red (`#8b0000`), subtle pulse animation
- [ ] `unavailable` — gray (`#6e7781`), text: "Size: ?"

> **Why "unavailable":** Never leave user confused. If stats fail, show something. Silent failure = broken UX.

### Injection Safety
- [ ] Check for existing badge **by ID**, not class: `#pr-size-guard-badge`
- [ ] Remove existing before injecting new — prevents duplicates
- [ ] Wrap injection in try/catch — never throw to console
- [ ] Scope all CSS classes with `pr-size-guard-` prefix

### CSS Scoping
```css
/* All rules scoped to prevent GitHub conflicts */
#pr-size-guard-badge { /* ... */ }
#pr-size-guard-badge.pr-size-guard--small { /* ... */ }
```

**Verification:** Badge appears with correct state, or "unavailable" on failure

---

## Phase 4: SPA Navigation (Day 2–3)

### Observer Lifecycle

> **Why this matters:** GitHub uses Turbo (PJAX). Page doesn't reload. MutationObserver leaks cause memory bloat and duplicate injections.

- [ ] Create **single** observer instance at init
- [ ] Store observer reference in module scope
- [ ] Disconnect observer on cleanup (extension unload)
- [ ] Use WeakRef or flag to prevent duplicate observers

### Observer Configuration
```javascript
const observerConfig = {
  childList: true,
  subtree: true,
  attributes: false,      // Not needed — reduces noise
  characterData: false    // Not needed — reduces noise
};
```

### Navigation Detection
- [ ] Track `lastProcessedUrl` in module scope
- [ ] On mutation, compare `location.href` to `lastProcessedUrl`
- [ ] Only re-inject if URL changed AND is a PR page

### PR Page Detection
```javascript
function isPRPage() {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(location.href);
}
```

### Debounce Implementation
- [ ] Debounce injection to 300ms — GitHub fires many mutations
- [ ] Cancel pending debounce on new navigation
- [ ] Use single timeout reference, clear before setting

### Duplicate Prevention Checklist
- [ ] Badge has unique ID, not just class
- [ ] Check for existing badge before injection
- [ ] Single observer instance (assert with flag)
- [ ] Debounce prevents rapid-fire injection

### GitHub-Specific Navigation Events
- [ ] Handle `turbo:load` event (if available)
- [ ] Handle `popstate` for back/forward
- [ ] Handle `pjax:end` (legacy, may still fire)

```javascript
// Supplement MutationObserver with explicit events
window.addEventListener('popstate', handleNavigation);
document.addEventListener('turbo:load', handleNavigation);
```

**Verification:** Navigate PR → PR → non-PR → PR. Badge correct each time. No duplicates.

---

## Phase 5: Settings Popup (Day 3)

### Storage Strategy

> **Why:** `chrome.storage.sync` has quota limits (102KB total, 8KB per item). Thresholds are tiny, but read timing matters.

- [ ] Read thresholds on content script init — cache locally
- [ ] Listen for `chrome.storage.onChanged` — update cache without page reload
- [ ] Write on popup save — validate before write
- [ ] Use defaults if storage read fails (network error, quota exceeded)

### Default Thresholds (Hardcoded Fallback)
```javascript
const DEFAULTS = {
  small:  { files: 5,  lines: 100  },
  medium: { files: 15, lines: 400  },
  large:  { files: 30, lines: 1000 }
};
```

### Popup Implementation
- [ ] Create `popup/popup.html` — minimal, no external resources
- [ ] Create `popup/popup.css` — scoped, no conflicts
- [ ] Create `popup/popup.js` — no `eval`, no inline scripts
- [ ] Validate inputs: positive integers only, medium > small, large > medium
- [ ] Show save confirmation (subtle, no alert)

### Popup Security (MV3 Compliance)
- [ ] No inline scripts in HTML — use separate .js file
- [ ] No `eval()` or `new Function()`
- [ ] No external CDN resources — bundle everything

**Verification:** Change thresholds, badge updates on next PR load. Settings persist after browser restart.

---

## Phase 6: Error Handling & Production Hardening (Day 4)

### Error Boundary Pattern
```javascript
function safeExecute(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    // Silent in production — no console.error
    return fallback;
  }
}
```

- [ ] Wrap all DOM access in try/catch
- [ ] Wrap storage operations in try/catch
- [ ] Wrap observer callbacks in try/catch
- [ ] Never let errors propagate to console in production

### Logging Strategy
- [ ] Create `DEBUG` flag, default `false`
- [ ] All logs gated: `if (DEBUG) console.log(...)`
- [ ] Production build has zero console output

### Memory Management
- [ ] Disconnect observer if navigating away from GitHub
- [ ] Clear timeout references on cleanup
- [ ] No global event listeners without cleanup path

### Graceful Degradation
| Failure | User Sees | Behavior |
|---------|-----------|----------|
| Stats extraction fails | "Size: ?" gray badge | Retry once, then show unavailable |
| Injection target missing | Nothing | Silent, no badge, no error |
| Storage read fails | Default thresholds used | Silent fallback |
| Storage write fails | "Save failed" in popup | User-visible error in popup only |

**Verification:** Throttle network, break selectors manually, confirm graceful handling

---

## Phase 7: Testing Matrix (Day 4)

### PR States
- [ ] Open PR
- [ ] Draft PR
- [ ] Merged PR
- [ ] Closed PR
- [ ] PR with 0 files changed
- [ ] PR with only renames
- [ ] PR with 1000+ files (stress test)

### Navigation Scenarios
- [ ] Direct URL load
- [ ] PR → PR (same repo)
- [ ] PR → PR (different repo)
- [ ] PR → non-PR → PR
- [ ] Browser back/forward
- [ ] Cmd+click (new tab)

### Visual States
- [ ] GitHub light mode
- [ ] GitHub dark mode
- [ ] GitHub dark dimmed mode
- [ ] Narrow viewport (mobile-ish)
- [ ] Very long PR title (badge wrapping)

### Failure Scenarios
- [ ] Slow network (3G throttle)
- [ ] Stats container missing (manually delete in DevTools)
- [ ] Injection target missing (manually delete in DevTools)
- [ ] Storage quota exceeded (fill storage, attempt save)

**Verification:** All scenarios handled without console errors

---

## Phase 8: Chrome Web Store Submission (Day 5)

### Pre-Submission Checklist

> **Why:** These are common rejection reasons. Check before submitting.

#### Manifest
- [ ] `manifest_version: 3` — required
- [ ] `version` follows semver (e.g., `1.0.0`)
- [ ] `name` ≤ 45 characters
- [ ] `description` ≤ 132 characters, no keyword stuffing
- [ ] No unused permissions
- [ ] `host_permissions` limited to `github.com` only

#### Code
- [ ] No `eval()`, `new Function()`, or dynamic code execution
- [ ] No inline scripts in HTML files
- [ ] No remote code loading (fetch + execute)
- [ ] No obfuscated/minified code that hides functionality
- [ ] All functionality matches store description

#### Privacy
- [ ] Privacy policy URL required (even for "no data collected")
- [ ] Minimal privacy policy content:
  ```
  PR Size Guard does not collect, store, or transmit any user data.
  All processing happens locally in your browser.
  No analytics, no tracking, no external requests.
  ```
- [ ] Host on GitHub Gist, GitHub Pages, or similar

#### Assets
- [ ] Icon: 128x128 PNG, no transparency issues, visible on dark/light
- [ ] Screenshots: 1280x800 or 640x400, showing extension in action
- [ ] At least 1 screenshot required

### Versioning
- [ ] Use semver: `MAJOR.MINOR.PATCH`
- [ ] Update version in `manifest.json` before each submission
- [ ] Create `CHANGELOG.md`:
  ```markdown
  ## 1.0.0 (YYYY-MM-DD)
  - Initial release
  - Badge injection for GitHub PRs
  - Customizable thresholds
  ```

### Submission
- [ ] Zip only required files (no `.git`, no `.DS_Store`, no dev files)
- [ ] Test zip by loading as unpacked extension
- [ ] Submit at https://chrome.google.com/webstore/devconsole
- [ ] Expect 1-3 day review time

**Verification:** Extension approved and live on Chrome Web Store

---

## Post-MVP (Backlog)

> **Do NOT implement until MVP is shipped and stable.**

- [ ] Tooltip with detailed breakdown
- [ ] Badge on PR list view (`/pulls`)
- [ ] Keyboard shortcut to toggle
- [ ] Custom label names
- [ ] Threshold presets
- [ ] Firefox port (MV2 required)
- [ ] Export/import settings

---

## Reference

### Selector Priority Lists

```javascript
// Files changed count
const FILES_SELECTORS = [
  '#files_tab_counter',
  '[data-tab-item="files"] .Counter',
  '.tabnav-tab[href*="files"] .Counter'
];

// Diff statistics
const DIFFSTAT_SELECTORS = [
  '.diffstat',
  '#diffstat',
  '.js-diff-progressive-container .diffstat'
];

// Injection targets
const INJECTION_SELECTORS = [
  '.gh-header-title',
  '.js-issue-title',
  '[data-testid="issue-title"]',
  '.gh-header-show h1'
];
```

### Test URLs
```
Small:     https://github.com/facebook/react/pull/28108
Medium:    https://github.com/vercel/next.js/pulls
Large:     https://github.com/microsoft/vscode/pulls
```

### Quick Commands
```bash
# Load extension
open -a "Google Chrome" chrome://extensions

# Create submission zip (macOS)
zip -r pr-size-guard.zip . -x "*.git*" -x "*.DS_Store" -x "*.md" -x "node_modules/*"
```

---

## Progress Log

| Date | Version | Phase | Notes |
|------|---------|-------|-------|
| — | 1.0.0 | — | Project started |
