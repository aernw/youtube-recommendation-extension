// YouTube Programming Feed Filter Content Script

let filterEnabled = false;
let whitelistKeywords = [];
let totalFilteredCount = 0;
let autoScrollTimer = null;
let isScrolling = false;

// Default programming keywords
const defaultKeywords = [
  'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'rust', 'golang', 'go lang', 
  'cpp', 'c++', 'c#', 'dotnet', 'java ', 'kotlin', 'swift', 'php', 'ruby', 'html', 
  'css', 'sass', 'sql', 'nosql', 'mongodb', 'postgres', 'mysql', 'docker', 'kubernetes', 
  'k8s', 'aws', 'gcp', 'azure', 'devops', 'git ', 'github', 'programming', 'coding', 
  'programmer', 'coder', 'developer', 'software engineer', 'computer science', 'algorithm', 
  'data structures', 'machine learning', 'deep learning', 'neural network', 'artificial intelligence', 
  ' ai ', 'web dev', 'frontend', 'backend', 'fullstack', 'compiler', 'interpreter', 'react', 
  'vue', 'angular', 'svelte', 'nextjs', 'nuxtjs', 'node.js', 'nodejs', 'expressjs', 
  'django', 'flask', 'fastapi', 'spring boot', 'linux', 'bash', 'terminal', 'cmd', 
  'vs code', 'vscode', 'neovim', 'vim', 'emacs', 'refactoring', 'clean code', 
  'design patterns', 'leetcoding', 'leetcode', 'hackerrank', 'codeforces', 'competitive programming', 
  'tech interview', 'system design', 'microservices', 'rest api', 'graphql', 'grpc', 
  'webassembly', 'wasm', 'flexbox', 'tailwind', 'bootstrap'
];

// Initialize settings from storage
chrome.storage.local.get(['filterEnabled', 'keywords', 'totalFilteredCount'], (result) => {
  filterEnabled = result.filterEnabled !== undefined ? result.filterEnabled : false;
  whitelistKeywords = result.keywords || defaultKeywords;
  totalFilteredCount = result.totalFilteredCount || 0;
  
  if (filterEnabled) {
    applyFilter();
  }
  
  injectToggleHeader();
});

// Listen for updates from popup or other parts of the extension
chrome.storage.onChanged.addListener((changes) => {
  if (changes.filterEnabled !== undefined) {
    filterEnabled = changes.filterEnabled.newValue;
    if (filterEnabled) {
      applyFilter();
    } else {
      disableFilter();
    }
    updateHeaderToggleUI();
  }
  if (changes.keywords !== undefined) {
    whitelistKeywords = changes.keywords.newValue;
    if (filterEnabled) {
      // Re-run filter on all items
      resetFilteredAttributes();
      applyFilter();
    }
  }
});

// Selectors for video items
const VIDEO_SELECTORS = [
  'ytd-rich-item-renderer',      // Homepage video cards
  'ytd-video-renderer',          // Search results
  'ytd-compact-video-renderer',  // Sidebar related videos
  'ytd-grid-video-renderer'      // Channel/playlist grid videos
];

// Selectors for shelves we might want to hide entirely (like Shorts shelf)
const SHELF_SELECTORS = [
  'ytd-rich-section-renderer',   // Homepage shelves (Shorts, etc.)
  'ytd-reel-shelf-renderer'      // Shorts shelves in other feeds
];

// Check if a text contains any of our programming keywords
function matchesKeywords(text, keywords) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  return keywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase().trim();
    if (!lowerKeyword) return false;
    
    // For short keywords (<= 3 chars), use word boundary matching
    if (lowerKeyword.length <= 3) {
      let escapedKeyword = lowerKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      let pattern = `\\b${escapedKeyword}\\b`;
      // Handle special characters like +, # where \b boundary fails
      if (lowerKeyword.includes('+') || lowerKeyword.includes('#')) {
        pattern = `(?:^|\\s|[\\.,!\\?\\(\\)\\[\\]{}\\-])${escapedKeyword}(?:$|\\s|[\\.,!\\?\\(\\)\\[\\]{}\\-])`;
      }
      const regex = new RegExp(pattern);
      return regex.test(lowerText);
    }
    
    // For longer keywords, standard substring match is safe and preferred
    return lowerText.includes(lowerKeyword);
  });
}

// Function to filter a single video item
function filterVideoItem(item) {
  if (!filterEnabled) return;
  if (item.getAttribute('data-filtered') !== null) return; // Already processed
  
  // Find title element
  const titleEl = item.querySelector('#video-title, #video-title-link, .ytd-video-renderer #video-title');
  const titleText = titleEl ? titleEl.textContent : '';
  
  // Find channel name element
  const channelEl = item.querySelector('ytd-channel-name, #channel-name, .ytd-channel-name');
  const channelText = channelEl ? channelEl.textContent : '';
  
  const fullText = `${titleText} ${channelText}`;
  
  if (matchesKeywords(fullText, whitelistKeywords)) {
    item.setAttribute('data-filtered', 'allowed');
    item.style.display = '';
  } else {
    item.setAttribute('data-filtered', 'blocked');
    item.style.display = 'none';
    
    // Increment filtered count
    totalFilteredCount++;
    chrome.storage.local.set({ totalFilteredCount });
  }
}

// Filter shelves (like Shorts)
function filterShelfItem(shelf) {
  if (!filterEnabled) return;
  if (shelf.getAttribute('data-filtered') !== null) return;
  
  // YouTube homepage Shorts shelf contains an icon or title specifying Shorts
  const shelfTitleEl = shelf.querySelector('#title, #title-text');
  const titleText = shelfTitleEl ? shelfTitleEl.textContent.toLowerCase() : '';
  
  // If it's a Shorts shelf, hide it to keep feed focused on long-form programming content
  if (titleText.includes('shorts') || shelf.querySelector('ytd-reel-shelf-renderer')) {
    shelf.setAttribute('data-filtered', 'blocked');
    shelf.style.display = 'none';
  } else {
    // Check if the contents inside contain any matching video (in case it's a standard shelf)
    shelf.setAttribute('data-filtered', 'allowed');
  }
}

// Scans the DOM and applies the filter to all video cards
function applyFilter() {
  if (!filterEnabled) return;
  
  // Filter video cards
  const videoElements = document.querySelectorAll(VIDEO_SELECTORS.join(','));
  videoElements.forEach(filterVideoItem);
  
  // Filter shelves
  const shelfElements = document.querySelectorAll(SHELF_SELECTORS.join(','));
  shelfElements.forEach(filterShelfItem);
  
  triggerAutoScrollIfNeeded();
}

// Restore all hidden elements when filter is disabled
function disableFilter() {
  const blockedElements = document.querySelectorAll('[data-filtered="blocked"]');
  blockedElements.forEach(el => {
    el.style.display = '';
    el.removeAttribute('data-filtered');
  });
  
  const allowedElements = document.querySelectorAll('[data-filtered="allowed"]');
  allowedElements.forEach(el => {
    el.removeAttribute('data-filtered');
  });
}

// Reset data-filtered attribute to re-evaluate elements
function resetFilteredAttributes() {
  const filteredElements = document.querySelectorAll('[data-filtered]');
  filteredElements.forEach(el => {
    el.removeAttribute('data-filtered');
    el.style.display = '';
  });
}

// Set up MutationObserver to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
  if (!filterEnabled) return;
  
  let shouldFilter = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldFilter = true;
      break;
    }
  }
  
  if (shouldFilter) {
    applyFilter();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Auto-scroll logic: if too many videos are hidden and the viewport is empty, scroll down to load more
function triggerAutoScrollIfNeeded() {
  if (!filterEnabled || isScrolling) return;
  
  // Only trigger on home feed or search results where scrolling loads more content
  const isFeedPage = window.location.pathname === '/' || window.location.pathname === '/results';
  if (!isFeedPage) return;
  
  clearTimeout(autoScrollTimer);
  autoScrollTimer = setTimeout(() => {
    const videoElements = document.querySelectorAll(VIDEO_SELECTORS.join(','));
    if (videoElements.length === 0) return;
    
    // Count visible videos in/near the viewport
    let visibleCount = 0;
    const viewportHeight = window.innerHeight;
    
    videoElements.forEach(el => {
      if (el.style.display !== 'none') {
        const rect = el.getBoundingClientRect();
        // Check if the card is within a reasonable distance from the top of viewport
        if (rect.top < viewportHeight * 1.5 && rect.bottom > -viewportHeight * 0.5) {
          visibleCount++;
        }
      }
    });
    
    // If less than 4 videos are visible, scroll down to load more content
    if (visibleCount < 4) {
      isScrolling = true;
      window.scrollBy({
        top: 1000,
        behavior: 'smooth'
      });
      
      // Release scrolling lock after animation completes
      setTimeout(() => {
        isScrolling = false;
        applyFilter(); // Trigger filter on newly scrolled content
      }, 800);
    }
  }, 300);
}

// Inject sleek "Programming Mode" Toggle switch in YouTube's top masthead
function injectToggleHeader() {
  // Check if already injected
  if (document.getElementById('yt-programming-filter-toggle-container')) return;
  
  // Find top bar container
  const targetHeader = document.querySelector('ytd-masthead #end, ytd-masthead #buttons');
  if (!targetHeader) {
    // Retry in 500ms if header not loaded yet
    setTimeout(injectToggleHeader, 500);
    return;
  }
  
  const toggleContainer = document.createElement('div');
  toggleContainer.id = 'yt-programming-filter-toggle-container';
  
  // Styles for the header toggle switch matching YouTube dark/light theme
  const style = document.createElement('style');
  style.textContent = `
    #yt-programming-filter-toggle-container {
      display: flex;
      align-items: center;
      margin-right: 16px;
      font-family: Roboto, Arial, sans-serif;
      font-size: 14px;
      color: var(--yt-spec-text-primary, #fff);
      user-select: none;
    }
    .yt-prog-label {
      margin-right: 8px;
      font-weight: 500;
      letter-spacing: 0.1px;
      white-space: nowrap;
      cursor: pointer;
    }
    .yt-prog-switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }
    .yt-prog-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .yt-prog-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--yt-spec-badge-chip-background, #aaa);
      transition: .3s;
      border-radius: 20px;
    }
    .yt-prog-slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }
    input:checked + .yt-prog-slider {
      background: linear-gradient(90deg, #00c6ff, #0072ff);
      box-shadow: 0 0 8px rgba(0, 198, 255, 0.4);
    }
    input:checked + .yt-prog-slider:before {
      transform: translateX(16px);
    }
  `;
  document.head.appendChild(style);
  
  toggleContainer.innerHTML = `
    <span class="yt-prog-label" title="Filters feed to only show programming videos">Dev Mode</span>
    <label class="yt-prog-switch">
      <input type="checkbox" id="yt-programming-filter-checkbox" ${filterEnabled ? 'checked' : ''}>
      <span class="yt-prog-slider"></span>
    </label>
  `;
  
  // Insert before the profile or first item in the header end buttons list
  targetHeader.insertBefore(toggleContainer, targetHeader.firstChild);
  
  // Attach event listener
  const checkbox = document.getElementById('yt-programming-filter-checkbox');
  checkbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ filterEnabled: isChecked });
  });
}

function updateHeaderToggleUI() {
  const checkbox = document.getElementById('yt-programming-filter-checkbox');
  if (checkbox) {
    checkbox.checked = filterEnabled;
  }
}
