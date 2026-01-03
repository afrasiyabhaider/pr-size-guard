/**
 * PR Size Guard — Content Script v1.1
 * 
 * Features:
 * - Targeted MutationObserver (not on body)
 * - Exponential backoff retry
 * - Multiple fallback selectors
 * - SPA navigation handling
 * - PR list page support
 */

(function () {
  'use strict';

  // ============================================================
  // Constants
  // ============================================================

  const BADGE_ID = 'pr-size-guard-badge';
  const BADGE_CLASS = 'pr-size-guard-badge';
  const LIST_BADGE_CLASS = 'pr-size-guard-list-badge';

  // Use shared constants (loaded via manifest)
  const { DEFAULTS, DEFAULT_COLORS, LABELS } = window.PRSizeGuard || {
    DEFAULTS: { small: { files: 5, lines: 100 }, medium: { files: 15, lines: 400 }, large: { files: 30, lines: 1000 } },
    DEFAULT_COLORS: { small: '#2ea44f', medium: '#d29922', large: '#cf222e', critical: '#8b0000' },
    LABELS: { small: 'Small', medium: 'Medium', large: 'Large', critical: 'Critical', unavailable: 'Size: ?' }
  };

  // Performance: Compile regex once
  const PR_PAGE_REGEX = /github\.com\/[^/]+\/[^/]+\/pull\/\d+/;
  const PR_LIST_REGEX = /github\.com\/[^/]+\/[^/]+\/pulls/;

  // Named timing constants
  const RETRY_BASE_DELAY_MS = 100;
  const OBSERVER_TIMEOUT_MS = 10000;
  const NAVIGATION_DEBOUNCE_MS = 150;

  // Fallback selectors for GitHub DOM changes
  const SELECTORS = {
    // PR page header targets
    prTitle: [
      '.gh-header-title',
      '.js-issue-title',
      '[data-testid="issue-title"]',
      '.gh-header-show h1',
      '#partial-discussion-header .gh-header-title'
    ],
    // Diff stats element
    diffStats: [
      '.diffstat',
      '#diffstat',
      '.js-diff-progressive-container .diffstat',
      '[data-testid="diffstat"]',
      '.toc-diff-stats .diffstat'
    ],
    // Files count element
    filesCount: [
      '#files_tab_counter',
      '[data-tab-item="files"] .Counter',
      '#files-tab-counter',
      '.tabnav-tab[href*="files"] .Counter',
      '[data-testid="files-tab-counter"]'
    ],
    // PR list page items
    prListItems: [
      '.js-issue-row',
      '[data-testid="issue-pr-row"]',
      '.Box-row.js-navigation-item'
    ],
    // Container to observe for lazy loading
    observeTarget: [
      '#repo-content-pjax-container',
      '#js-repo-pjax-container',
      '.repository-content',
      'main',
      '#js-pjax-container'
    ]
  };

  // ============================================================
  // State
  // ============================================================

  let thresholds = DEFAULTS;
  let colors = DEFAULT_COLORS;
  let enabled = true;
  let observer = null;
  let lastUrl = location.href;

  // ============================================================
  // Utility Functions
  // ============================================================

  /**
   * Query selector with fallbacks
   * @param {string[]} selectors - Array of selectors to try
   * @returns {Element|null}
   */
  function $(selectors) {
    if (typeof selectors === 'string') {
      return document.querySelector(selectors);
    }
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch (e) { /* invalid selector */ }
    }
    return null;
  }

  /**
   * Query all elements with fallbacks
   * @param {string[]} selectors - Array of selectors to try
   * @returns {Element[]}
   */
  function $$(selectors) {
    for (const sel of selectors) {
      try {
        const els = document.querySelectorAll(sel);
        if (els.length) return Array.from(els);
      } catch (e) { /* invalid selector */ }
    }
    return [];
  }

  /**
   * Parse number from text, handling commas
   * @param {string} text
   * @returns {number}
   */
  function parseNum(text) {
    return parseInt((text || '').replace(/[^\d]/g, ''), 10) || 0;
  }

  /**
   * Check if current page is a PR detail page
   * @returns {boolean}
   */
  function isPRPage() {
    return PR_PAGE_REGEX.test(location.href);
  }

  /**
   * Check if current page is a PR list page
   * @returns {boolean}
   */
  function isPRListPage() {
    return PR_LIST_REGEX.test(location.href);
  }

  /**
   * Debounce function
   * @param {Function} fn
   * @param {number} ms
   * @returns {Function}
   */
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // ============================================================
  // Classification
  // ============================================================

  /**
   * Classify PR size based on stats and thresholds
   * @param {Object} stats - { filesChanged, totalLines }
   * @returns {string} - 'small' | 'medium' | 'large' | 'critical' | 'unavailable'
   */
  function classify(stats) {
    if (!stats) return 'unavailable';
    
    const { filesChanged: f, totalLines: l } = stats;
    const t = thresholds;
    
    const fileLevel = f <= t.small.files ? 0 : f <= t.medium.files ? 1 : f <= t.large.files ? 2 : 3;
    const lineLevel = l <= t.small.lines ? 0 : l <= t.medium.lines ? 1 : l <= t.large.lines ? 2 : 3;
    
    return ['small', 'medium', 'large', 'critical'][Math.max(fileLevel, lineLevel)];
  }

  // ============================================================
  // PR Detail Page
  // ============================================================

  /**
   * Extract PR stats from the page
   * @returns {Object|null}
   */
  function extractStats() {
    const diff = $(SELECTORS.diffStats);
    if (!diff) return null;

    const text = diff.textContent || '';
    
    // Match additions: +123 or 123 additions
    const addMatch = text.match(/\+\s*([\d,]+)/) || text.match(/([\d,]+)\s*addition/i);
    // Match deletions: -123 or −123 or 123 deletions
    const delMatch = text.match(/[-−]\s*([\d,]+)/) || text.match(/([\d,]+)\s*deletion/i);
    
    const additions = addMatch ? parseNum(addMatch[1]) : 0;
    const deletions = delMatch ? parseNum(delMatch[1]) : 0;
    
    const filesEl = $(SELECTORS.filesCount);
    const filesChanged = filesEl ? parseNum(filesEl.textContent) : 0;

    if (!filesChanged && !additions && !deletions) return null;

    return {
      filesChanged,
      additions,
      deletions,
      totalLines: additions + deletions
    };
  }

  /**
   * Create and inject badge into PR header
   * @param {string} category
   * @param {Object|null} stats
   */
  function injectBadge(category, stats) {
    // Remove existing badge
    const existing = document.getElementById(BADGE_ID);
    if (existing) existing.remove();

    const target = $(SELECTORS.prTitle);
    if (!target) return;

    const badge = document.createElement('span');
    badge.id = BADGE_ID;
    badge.className = `${BADGE_CLASS} pr-size-guard--${category}`;
    badge.textContent = LABELS[category];

    // Apply custom colors if available
    if (colors[category]) {
      badge.style.backgroundColor = colors[category];
    }

    if (stats) {
      badge.title = [
        `PR Size: ${LABELS[category]}`,
        '───────────────',
        `Files: ${stats.filesChanged}`,
        `Added: +${stats.additions}`,
        `Deleted: -${stats.deletions}`,
        `Total: ${stats.totalLines}`
      ].join('\n');
    }

    target.appendChild(badge);
  }

  /**
   * Process PR detail page with retry logic
   * @param {number} attempt
   */
  function processPRPage(attempt = 0) {
    const stats = extractStats();
    
    if (!stats && attempt < 5) {
      // Exponential backoff: 100, 200, 400, 800, 1600ms
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      setTimeout(() => processPRPage(attempt + 1), delay);
      return;
    }

    const category = classify(stats);
    injectBadge(category, stats);
  }

  // ============================================================
  // PR List Page
  // ============================================================

  /**
   * Process PR list page - add mini badges to each PR row
   */
  function processPRListPage() {
    // Remove existing list badges
    document.querySelectorAll(`.${LIST_BADGE_CLASS}`).forEach(el => el.remove());

    const rows = $$(SELECTORS.prListItems);
    
    rows.forEach(row => {
      // Find the additions/deletions in the row
      const diffEl = row.querySelector('.diffstat') || row.querySelector('[class*="diffstat"]');
      if (!diffEl) return;

      const text = diffEl.textContent || '';
      const addMatch = text.match(/\+\s*([\d,]+)/);
      const delMatch = text.match(/[-−]\s*([\d,]+)/);
      
      const additions = addMatch ? parseNum(addMatch[1]) : 0;
      const deletions = delMatch ? parseNum(delMatch[1]) : 0;
      const totalLines = additions + deletions;

      // Estimate files from the PR (not always available in list view)
      const filesChanged = 0; // Can't reliably get this from list view
      
      const stats = { filesChanged, additions, deletions, totalLines };
      const category = classify(stats);

      // Find title link to append badge
      const titleLink = row.querySelector('a[data-hovercard-type="pull_request"]') ||
                        row.querySelector('.js-navigation-open') ||
                        row.querySelector('a[href*="/pull/"]');
      
      if (!titleLink) return;

      const badge = document.createElement('span');
      badge.className = `${LIST_BADGE_CLASS} pr-size-guard--${category}`;
      badge.textContent = category.charAt(0).toUpperCase(); // S, M, L, C
      badge.title = `${category.charAt(0).toUpperCase() + category.slice(1)} PR: +${additions} / -${deletions}`;
      
      // Apply custom colors
      const bgColor = colors[category] || DEFAULT_COLORS[category];
      badge.style.cssText = `margin-left: 6px; font-size: 10px; padding: 1px 4px; border-radius: 3px; vertical-align: middle; background-color: ${bgColor}; color: #fff;`;

      titleLink.parentNode.insertBefore(badge, titleLink.nextSibling);
    });
  }

  // ============================================================
  // Targeted MutationObserver
  // ============================================================

  /**
   * Setup observer for lazy-loaded content (targeted, not on body)
   */
  function setupObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    // Only observe on PR pages
    if (!isPRPage()) return;

    // Find a specific container to observe (not body)
    const container = $(SELECTORS.observeTarget);
    if (!container) return;

    let processed = false;
    const debouncedProcess = debounce(() => {
      if (!processed && $(SELECTORS.diffStats)) {
        processed = true;
        processPRPage();
        observer?.disconnect();
      }
    }, 100);

    observer = new MutationObserver(debouncedProcess);
    
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    // Auto-disconnect after timeout to prevent memory leaks
    setTimeout(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }, OBSERVER_TIMEOUT_MS);
  }

  // ============================================================
  // Navigation Handling
  // ============================================================

  /**
   * Handle page navigation
   */
  function handleNavigation() {
    const currentUrl = location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;

    // Clean up existing badges
    removeBadges();

    // Only process if enabled
    if (!enabled) return;

    if (isPRPage()) {
      processPRPage();
      setupObserver();
    } else if (isPRListPage()) {
      processPRListPage();
    }
  }

  const debouncedNavigation = debounce(handleNavigation, NAVIGATION_DEBOUNCE_MS);

  /**
   * Setup navigation event listeners
   */
  function setupNavigationListeners() {
    // GitHub Turbo navigation
    document.addEventListener('turbo:load', debouncedNavigation);
    document.addEventListener('turbo:render', debouncedNavigation);
    document.addEventListener('turbo:before-render', () => {
      document.getElementById(BADGE_ID)?.remove();
    });

    // Legacy PJAX
    document.addEventListener('pjax:end', debouncedNavigation);

    // Browser navigation
    window.addEventListener('popstate', debouncedNavigation);

    // Note: URL polling removed for performance - navigation events are sufficient
  }

  // ============================================================
  // Storage
  // ============================================================

  /**
   * Load thresholds from storage
   */
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['thresholds', 'colors', 'enabled']);
      thresholds = result.thresholds || DEFAULTS;
      colors = result.colors || DEFAULT_COLORS;
      enabled = result.enabled !== false; // Default to true
    } catch (e) {
      thresholds = DEFAULTS;
      colors = DEFAULT_COLORS;
      enabled = true;
    }
  }

  /**
   * Listen for threshold changes
   */
  function setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      
      let needsRefresh = false;
      
      if (changes.thresholds) {
        thresholds = changes.thresholds.newValue || DEFAULTS;
        needsRefresh = true;
      }
      
      if (changes.colors) {
        colors = changes.colors.newValue || DEFAULT_COLORS;
        needsRefresh = true;
      }
      
      if (changes.enabled !== undefined) {
        enabled = changes.enabled.newValue !== false;
        if (!enabled) {
          // Remove badges when disabled
          removeBadges();
          return;
        }
        needsRefresh = true;
      }
      
      if (needsRefresh && enabled) {
        if (isPRPage()) {
          processPRPage();
        } else if (isPRListPage()) {
          processPRListPage();
        }
      }
    });
  }

  /**
   * Remove all badges from the page
   */
  function removeBadges() {
    document.getElementById(BADGE_ID)?.remove();
    document.querySelectorAll(`.${LIST_BADGE_CLASS}`).forEach(el => el.remove());
  }

  /**
   * Listen for toggle messages from background script
   */
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'TOGGLE_EXTENSION') {
        enabled = message.enabled;
        
        if (enabled) {
          if (isPRPage()) {
            processPRPage();
          } else if (isPRListPage()) {
            processPRListPage();
          }
        } else {
          removeBadges();
        }
        
        sendResponse({ success: true });
      }
      return true;
    });
  }

  // ============================================================
  // Initialization
  // ============================================================

  async function init() {
    await loadSettings();
    setupStorageListener();
    setupMessageListener();
    setupNavigationListeners();

    // Initial processing (only if enabled)
    if (enabled) {
      if (isPRPage()) {
        processPRPage();
        setupObserver();
      } else if (isPRListPage()) {
        processPRListPage();
      }
    }
  }

  // Start
  init();

})();
