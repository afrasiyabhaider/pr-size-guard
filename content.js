/**
 * PR Size Guard — Content Script
 * MINIMAL: No polling, no observers, just run once
 */

(function () {
  'use strict';

  const BADGE_ID = 'pr-size-guard-badge';
  
  const DEFAULTS = {
    small: { files: 5, lines: 100 },
    medium: { files: 15, lines: 400 },
    large: { files: 30, lines: 1000 }
  };

  let thresholds = null;

  function run() {
    // Already have badge? Skip
    if (document.getElementById(BADGE_ID)) return;

    // Find injection target
    const target = document.querySelector('.gh-header-title') || 
                   document.querySelector('.js-issue-title');
    if (!target) return;

    // Get stats
    const diff = document.querySelector('.diffstat');
    let stats = null;
    let category = 'unavailable';

    if (diff) {
      const text = diff.textContent || '';
      const addMatch = text.match(/\+\s*([\d,]+)/);
      const delMatch = text.match(/[-−]\s*([\d,]+)/);
      const additions = addMatch ? parseInt(addMatch[1].replace(/,/g, ''), 10) : 0;
      const deletions = delMatch ? parseInt(delMatch[1].replace(/,/g, ''), 10) : 0;
      
      const filesEl = document.getElementById('files_tab_counter');
      const files = filesEl ? parseInt(filesEl.textContent.replace(/\D/g, ''), 10) || 0 : 0;
      
      if (files || additions || deletions) {
        stats = { filesChanged: files, additions, deletions, totalLines: additions + deletions };
        
        // Classify
        const t = thresholds || DEFAULTS;
        const f = stats.filesChanged;
        const l = stats.totalLines;
        const fc = f <= t.small.files ? 0 : f <= t.medium.files ? 1 : f <= t.large.files ? 2 : 3;
        const lc = l <= t.small.lines ? 0 : l <= t.medium.lines ? 1 : l <= t.large.lines ? 2 : 3;
        category = ['small', 'medium', 'large', 'critical'][Math.max(fc, lc)];
      }
    }

    // Create badge
    const labels = { small: 'Small', medium: 'Medium', large: 'Large', critical: 'Critical', unavailable: 'Size: ?' };
    const badge = document.createElement('span');
    badge.id = BADGE_ID;
    badge.className = 'pr-size-guard-badge pr-size-guard--' + category;
    badge.textContent = labels[category];
    
    if (stats) {
      badge.title = 'PR Size: ' + labels[category] + '\n───────────────\nFiles: ' + stats.filesChanged + '\nAdded: +' + stats.additions + '\nDeleted: -' + stats.deletions + '\nTotal: ' + stats.totalLines;
    }
    
    target.appendChild(badge);
  }

  // Load settings then run
  chrome.storage.sync.get('thresholds').then(function(r) {
    thresholds = r.thresholds || DEFAULTS;
    run();
  }).catch(function() {
    thresholds = DEFAULTS;
    run();
  });

  // Handle SPA navigation
  document.addEventListener('turbo:render', function() {
    document.getElementById(BADGE_ID)?.remove();
    run();
  });

})();
