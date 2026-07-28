// YouTube Programming Feed Filter & Recommendation Injector Content Script

let filterEnabled = false;
let whitelistKeywords = [];
let totalFilteredCount = 0;
let autoScrollTimer = null;
let isScrolling = false;
let currentPath = window.location.pathname;

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
  'webassembly', 'wasm', 'flexbox', 'tailwind', 'bootstrap',
  // French translations & terms
  'programmation', 'développeur', 'developpeur', 'informatique', 'codeur', 'tutoriel', 'tuto'
];

// Console debug log helper
function logDebug(message, isAllowed) {
  const color = isAllowed ? '#10b981' : '#ef4444';
  console.log(`%c[DevStream] ${message}`, `color: ${color}; font-weight: 500;`);
}

// Initialize settings from storage
chrome.storage.local.get(['filterEnabled', 'keywords', 'totalFilteredCount'], (result) => {
  filterEnabled = result.filterEnabled !== undefined ? result.filterEnabled : false;
  whitelistKeywords = result.keywords || defaultKeywords;
  totalFilteredCount = result.totalFilteredCount || 0;
  
  injectStyles();
  injectToggleHeader();
  
  if (filterEnabled) {
    handleRouteChange();
  }
});

// Listen for updates from popup or other parts of the extension
chrome.storage.onChanged.addListener((changes) => {
  if (changes.filterEnabled !== undefined) {
    filterEnabled = changes.filterEnabled.newValue;
    if (filterEnabled) {
      handleRouteChange();
    } else {
      disableFilter();
      teardownHomepageGrid();
    }
    updateHeaderToggleUI();
  }
  if (changes.keywords !== undefined) {
    whitelistKeywords = changes.keywords.newValue;
    if (filterEnabled) {
      if (window.location.pathname === '/') {
        // Re-initialize homepage recommendations with new keywords
        setupHomepageGrid(true);
      } else {
        resetFilteredAttributes();
        applyFilter();
      }
    }
  }
});

// Selectors for video items (standard filters on watch/results pages)
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

// Injected styling for custom programming recommendation feed and toggle switch
function injectStyles() {
  if (document.getElementById('devstream-injected-styles')) return;
  const style = document.createElement('style');
  style.id = 'devstream-injected-styles';
  style.textContent = `
    /* Toggle switch header styles - Explicitly sized to prevent stretching YouTube Header */
    #yt-programming-filter-toggle-container {
      display: flex;
      align-items: center;
      margin-right: 16px;
      height: 40px;            /* Fix: Match YouTube's default button heights */
      align-self: center;      /* Fix: Vertically align in header without stretching it */
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

    /* Custom Recommendation Grid styles */
    #devstream-feed-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 40px 16px;
      padding: 24px 0;
      max-width: 1280px;
      margin: 0 auto;
      background-color: var(--yt-spec-general-background-a, #0f0f0f);
    }
    .dev-video-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      text-decoration: none;
      background: transparent;
      outline: none;
    }
    .dev-thumb-container {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      border-radius: 12px;
      overflow: hidden;
      background-color: var(--yt-spec-badge-chip-background, #2c2c2c);
    }
    .dev-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .dev-video-card:hover .dev-thumb-img {
      transform: scale(1.03);
    }
    .dev-duration {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background-color: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .dev-details {
      display: flex;
      gap: 12px;
      padding: 0 4px;
    }
    
    /* Channel Avatar styles */
    .dev-channel-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      background-color: var(--yt-spec-badge-chip-background, #2c2c2c);
    }
    .dev-channel-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .dev-channel-avatar-letter {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
    }
    
    .dev-meta-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-grow: 1;
      min-width: 0;
    }
    .dev-title {
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      color: var(--yt-spec-text-primary, #fff);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dev-channel-name {
      font-size: 12px;
      color: var(--yt-spec-text-secondary, #aaa);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dev-meta-line {
      font-size: 12px;
      color: var(--yt-spec-text-secondary, #aaa);
    }
    .dev-spinner {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px 0;
      width: 100%;
      grid-column: 1 / -1;
      gap: 16px;
    }
    .dev-spinner-circle {
      width: 36px;
      height: 36px;
      border: 3.5px solid var(--yt-spec-badge-chip-background, #333);
      border-top: 3.5px solid var(--accent-primary, #00c6ff);
      border-radius: 50%;
      animation: dev-spin 0.8s linear infinite;
    }
    .dev-spinner-text {
      font-size: 14px;
      color: var(--yt-spec-text-secondary, #aaa);
      font-family: Roboto, Arial, sans-serif;
    }
    .dev-empty-msg {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: var(--yt-spec-text-secondary, #aaa);
      font-family: Roboto, Arial, sans-serif;
      font-size: 15px;
      background-color: var(--yt-spec-badge-chip-background, #1f1f1f);
      border-radius: 12px;
      border: 1px dashed rgba(255,255,255,0.1);
    }
    @keyframes dev-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// -------------------------------------------------------------
// REDESIGNED HOMEPAGE INJECTION FLOW
// -------------------------------------------------------------

// Routing controller for Single Page Application navigation
function handleRouteChange() {
  if (!filterEnabled) return;
  
  const isHomepage = window.location.pathname === '/';
  
  if (isHomepage) {
    setupHomepageGrid();
  } else {
    teardownHomepageGrid();
    applyFilter(); // Apply standard observers to search/watch recommendations
  }
}

let scrollListenerAttached = false;
let currentOffset = 0;

// Setup custom grid & hide YouTube original homepage grid
async function setupHomepageGrid(forceRefresh = false) {
  const originalGrid = document.querySelector('ytd-rich-grid-renderer');
  if (!originalGrid) {
    // Retry in 200ms if home feed hasn't rendered in DOM yet
    setTimeout(() => setupHomepageGrid(forceRefresh), 200);
    return;
  }
  
  // Hide original grid
  originalGrid.style.display = 'none';
  
  // Locate or create custom grid container
  let customGrid = document.getElementById('devstream-feed-grid');
  if (!customGrid) {
    customGrid = document.createElement('div');
    customGrid.id = 'devstream-feed-grid';
    // Insert right after the hidden original grid
    originalGrid.parentNode.insertBefore(customGrid, originalGrid.nextSibling);
  }
  
  if (customGrid.children.length === 0 || forceRefresh) {
    customGrid.innerHTML = '';
    currentOffset = 0;
    await loadInitialRecommendations();
  }
  
  // Attach Infinite Scroll listener
  if (!scrollListenerAttached) {
    window.addEventListener('scroll', handleInfiniteScroll);
    scrollListenerAttached = true;
  }
}

// Restore YouTube original feed
function teardownHomepageGrid() {
  const originalGrid = document.querySelector('ytd-rich-grid-renderer');
  if (originalGrid) {
    originalGrid.style.display = '';
  }
  
  const customGrid = document.getElementById('devstream-feed-grid');
  if (customGrid) {
    customGrid.remove();
  }
  
  if (scrollListenerAttached) {
    window.removeEventListener('scroll', handleInfiniteScroll);
    scrollListenerAttached = false;
  }
}

// Formulate queries from keywords & fetch videos
async function loadInitialRecommendations() {
  showLoadingSpinner();
  
  // Seed with 8 keywords to fully populate the homepage
  const keywordsToFetch = getKeywordsToFetch(8);
  const promises = keywordsToFetch.map(kw => fetchVideosForKeyword(kw));
  const results = await Promise.all(promises);
  
  // Flatten and filter duplicates
  let videos = results.flat().filter(v => v !== null);
  
  // Score and sort by engagement/recency rather than random shuffling
  videos = scoreAndRankVideos(videos);
  
  hideLoadingSpinner();
  
  if (videos.length === 0) {
    showEmptyMessage("Could not fetch programming content. Please check your internet connection.");
    return;
  }
  
  renderVideoCards(videos);
}

// Load more recommendations on scroll
async function loadMoreRecommendations() {
  if (isScrolling) return;
  isScrolling = true;
  
  const customGrid = document.getElementById('devstream-feed-grid');
  if (!customGrid) return;
  
  // Render smaller inline spinner at the bottom
  const bottomSpinner = document.createElement('div');
  bottomSpinner.className = 'dev-spinner';
  bottomSpinner.style.padding = '30px 0';
  bottomSpinner.innerHTML = `<div class="dev-spinner-circle"></div>`;
  customGrid.appendChild(bottomSpinner);
  
  // Select another 4 random keywords to fetch next batch
  const keywordsToFetch = getKeywordsToFetch(4);
  const promises = keywordsToFetch.map(kw => fetchVideosForKeyword(kw));
  const results = await Promise.all(promises);
  
  let newVideos = results.flat().filter(v => v !== null);
  newVideos = scoreAndRankVideos(newVideos);
  
  bottomSpinner.remove();
  
  if (newVideos.length > 0) {
    renderVideoCards(newVideos);
  }
  
  isScrolling = false;
}

// Infinite scroll trigger
function handleInfiniteScroll() {
  if (!filterEnabled || isScrolling) return;
  
  const customGrid = document.getElementById('devstream-feed-grid');
  if (!customGrid) return;
  
  const rect = customGrid.getBoundingClientRect();
  // Fetch more when user is near bottom of feed container (1.5x window height remaining)
  if (rect.bottom < window.innerHeight * 1.5) {
    loadMoreRecommendations();
  }
}

// Formulate queries that steer away from massive "courses" and focus on tips, workflows, tools, and trends
function getTargetedQuery(keyword) {
  const kw = keyword.toLowerCase().trim();
  
  // Custom modifiers that pull highly practical daily dev content
  const searchModifiers = [
    'tips and tricks workflow',
    'best practices architecture',
    'new features trends',
    'tools setup productivity',
    'real world application project',
    'comparison review recommendation'
  ];
  
  // If keyword already contains structural terms, keep it
  if (kw.includes('tips') || kw.includes('practices') || kw.includes('new') || kw.includes('tools') || kw.includes('setup') || kw.includes('workflow')) {
    return keyword;
  }
  
  const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
  return `${keyword} ${modifier}`;
}

// Fetch search results and parse elements in background
async function fetchVideosForKeyword(keyword) {
  const query = getTargetedQuery(keyword);
  try {
    logDebug(`Fetching fresh recommendations for: "${query}"...`, true);
    const response = await fetch(`/results?search_query=${encodeURIComponent(query)}`);
    const html = await response.text();
    
    const ytInitialData = parseYtInitialData(html);
    if (!ytInitialData) return [];
    
    const renderers = findVideoRenderers(ytInitialData);
    return renderers.map(extractVideoData).filter(v => v !== null);
  } catch (err) {
    console.error(`DevStream failed to fetch results for ${keyword}:`, err);
    return [];
  }
}

// Extract essential items from ytInitialData payload
function parseYtInitialData(html) {
  const match = html.match(/ytInitialData\s*=\s*({.*?});/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    return null;
  }
}

// Recursively parse JSON structure to extract video renderers
function findVideoRenderers(obj) {
  const renderers = [];
  
  function traverse(item) {
    if (!item || typeof item !== 'object') return;
    
    if (item.videoRenderer) {
      renderers.push(item.videoRenderer);
      return;
    }
    
    for (const key in item) {
      if (item.hasOwnProperty(key)) {
        traverse(item[key]);
      }
    }
  }
  
  traverse(obj);
  return renderers;
}

// Helper to parse duration string (e.g. "2:15:30" or "0:45") to seconds
function parseDurationToSeconds(durationStr) {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  }
  return 0;
}

// Check if a video is a massive reference lecture course to filter them down
function isMassiveCourse(title, durationSec) {
  const t = title.toLowerCase();
  const courseKeywords = [
    'full course', 'cours complet', 'course for free', 'complete course', 
    'complete tutorial for beginners', 'aprende desde cero', 
    'learn in 12 hours', 'course in one video', 'hours course', 'complet de a'
  ];
  
  const hasCourseKeyword = courseKeywords.some(kw => t.includes(kw));
  // Filter if it has course keywords AND is longer than 1.5 hours (5400 seconds)
  return hasCourseKeyword && durationSec > 5400;
}

// Normalize video objects from backend schema
function extractVideoData(renderer) {
  try {
    const videoId = renderer.videoId;
    if (!videoId) return null;
    
    const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || '';
    const thumbnail = renderer.thumbnail?.thumbnails?.[0]?.url || '';
    
    // Extracted actual channel avatar picture URL
    const channelAvatar = renderer.channelThumbnail?.thumbnails?.[0]?.url || '';
    
    const channelName = renderer.longBylineText?.runs?.[0]?.text || renderer.longBylineText?.simpleText || '';
    const publishedTime = renderer.publishedTimeText?.simpleText || '';
    const viewCount = renderer.viewCountText?.simpleText || renderer.viewCountText?.runs?.[0]?.text || '';
    const duration = renderer.lengthText?.simpleText || '';
    
    if (!title) return null;
    
    const durationSec = parseDurationToSeconds(duration);
    
    // 2. Exclude YouTube Shorts (videos shorter than 60 seconds)
    if (duration && durationSec < 60) {
      return null;
    }
    
    // 3. Exclude massive "Full Course" tutorials (> 1.5 hours)
    if (isMassiveCourse(title, durationSec)) {
      return null;
    }
    
    return { videoId, title, thumbnail, channelAvatar, channelName, publishedTime, viewCount, duration };
  } catch (e) {
    return null;
  }
}

// Render video card elements inside custom grid
function renderVideoCards(videos) {
  const grid = document.getElementById('devstream-feed-grid');
  if (!grid) return;
  
  videos.forEach(v => {
    // Prevent duplicate injections
    if (document.getElementById(`dev-card-${v.videoId}`)) return;
    
    const card = document.createElement('a');
    card.id = `dev-card-${v.videoId}`;
    card.className = 'dev-video-card';
    card.href = `/watch?v=${v.videoId}`;
    
    const avatarLetter = v.channelName ? v.channelName.charAt(0) : '?';
    
    // Render actual channel profile picture if found, fallback to letter avatar circle
    const avatarHtml = v.channelAvatar
      ? `<img class="dev-channel-avatar-img" src="${v.channelAvatar}" alt="${v.channelName}" loading="lazy">`
      : `<div class="dev-channel-avatar-letter">${avatarLetter}</div>`;
    
    card.innerHTML = `
      <div class="dev-thumb-container">
        <img class="dev-thumb-img" src="${v.thumbnail}" loading="lazy" alt="${v.title}">
        ${v.duration ? `<span class="dev-duration">${v.duration}</span>` : ''}
      </div>
      <div class="dev-details">
        <div class="dev-channel-avatar">${avatarHtml}</div>
        <div class="dev-meta-container">
          <h3 class="dev-title" title="${v.title}">${v.title}</h3>
          <div class="dev-channel-name" title="${v.channelName}">${v.channelName}</div>
          <div class="dev-meta-line">
            <span>${v.viewCount}</span>
            ${v.publishedTime ? `<span> • ${v.publishedTime}</span>` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Support SPA navigation inside YouTube framework
    card.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `/watch?v=${v.videoId}`;
    });
    
    grid.appendChild(card);
  });
}

// Get count of keywords, fallback to defaults if list is too small to fully seed page
function getKeywordsToFetch(count) {
  let list = [...whitelistKeywords];
  if (list.length < count) {
    // Supplement with random default keywords
    const diff = count - list.length;
    const availableDefaults = defaultKeywords.filter(k => !list.includes(k));
    const extra = [];
    const temp = [...availableDefaults];
    for (let i = 0; i < Math.min(diff, availableDefaults.length); i++) {
      const idx = Math.floor(Math.random() * temp.length);
      extra.push(temp.splice(idx, 1)[0]);
    }
    list = [...list, ...extra];
  }
  
  // Now pick 'count' keywords randomly from this list
  const selected = [];
  const temp = [...list];
  for (let i = 0; i < Math.min(count, list.length); i++) {
    const idx = Math.floor(Math.random() * temp.length);
    selected.push(temp.splice(idx, 1)[0]);
  }
  return selected;
}

// -------------------------------------------------------------
// METRIC SCORING FLOW (PRIVILEGE RECENT & POPULAR)
// -------------------------------------------------------------

// Score and rank videos (Views multiplied by recency weight)
function scoreAndRankVideos(videos) {
  return videos
    .map(v => {
      const views = parseViewsCount(v.viewCount);
      const recencyWeight = calculateRecencyMultiplier(v.publishedTime);
      const score = views * recencyWeight;
      return { ...v, score };
    })
    .sort((a, b) => b.score - a.score);
}

// Parse views string (e.g. "1,2 M de vues" or "150 k vues") to integer
function parseViewsCount(viewStr) {
  if (!viewStr) return 1000; // Small default for videos with no views string
  
  const clean = viewStr.toLowerCase().replace(/[^0-9kMmb\. ,]/g, '').trim();
  let num = parseFloat(clean.replace(/,/g, '.').replace(/ /g, ''));
  if (isNaN(num)) return 1000;
  
  if (viewStr.toLowerCase().includes('m')) {
    return num * 1000000;
  }
  if (viewStr.toLowerCase().includes('k') || viewStr.toLowerCase().includes('o')) {
    return num * 1000;
  }
  return num;
}

// Calculate multiplier weight based on upload time relative to today
function calculateRecencyMultiplier(timeStr) {
  if (!timeStr) return 0.5;
  const str = timeStr.toLowerCase();
  
  // Very recent (minutes, hours)
  if (str.includes('hour') || str.includes('heure') || str.includes('minute') || str.includes('second')) {
    return 2.0;
  }
  // Days
  if (str.includes('day') || str.includes('jour')) {
    return 1.8;
  }
  // Weeks
  if (str.includes('week') || str.includes('semaine')) {
    return 1.5;
  }
  // Months
  if (str.includes('month') || str.includes('mois')) {
    return 1.0;
  }
  
  // Years (heavily discount older courses unless they are highly relevant)
  if (str.includes('year') || str.includes('an')) {
    const match = str.match(/(\d+)/);
    if (match) {
      const years = parseInt(match[1]);
      if (years >= 5) return 0.01;  // Legacy, probably deprecated tech
      if (years >= 3) return 0.05;
      if (years >= 2) return 0.15;
      return 0.35; // 1 year ago
    }
    return 0.35;
  }
  
  return 0.5;
}

// Loader UI feedback
function showLoadingSpinner() {
  const grid = document.getElementById('devstream-feed-grid');
  if (!grid) return;
  
  const spinner = document.createElement('div');
  spinner.id = 'devstream-spinner';
  spinner.className = 'dev-spinner';
  spinner.innerHTML = `
    <div class="dev-spinner-circle"></div>
    <span class="dev-spinner-text">Personalizing your developer feed...</span>
  `;
  grid.appendChild(spinner);
}

// Hide loading state
function hideLoadingSpinner() {
  const spinner = document.getElementById('devstream-spinner');
  if (spinner) spinner.remove();
}

// Display empty feedback
function showEmptyMessage(msgText) {
  const grid = document.getElementById('devstream-feed-grid');
  if (!grid) return;
  
  const msg = document.createElement('div');
  msg.className = 'dev-empty-msg';
  msg.textContent = msgText;
  grid.appendChild(msg);
}

// -------------------------------------------------------------
// STANDARD FEED FILTERING FLOW (USED ON WATCH / SEARCH RESULTS PAGES)
// -------------------------------------------------------------

// Function to filter a single video item using innerText to penetrate Shadow DOM
function filterVideoItem(item) {
  if (!filterEnabled) return;
  if (item.getAttribute('data-filtered') !== null) return; // Already processed
  
  // innerText fetches all visible text, successfully penetrating any Shadow DOM boundaries
  const cardText = (item.innerText || item.textContent || '').trim();
  
  // If the card text is very short or empty, it's still loading (skeleton state). Skip for now.
  if (cardText.length < 10) {
    return;
  }
  
  const isMatch = matchesKeywords(cardText, whitelistKeywords);
  const displaySnippet = cardText.replace(/\s+/g, ' ').substring(0, 60);
  
  if (isMatch) {
    item.setAttribute('data-filtered', 'allowed');
    item.style.display = '';
    logDebug(`ALLOWED WATCH RECOMMENDATION: "${displaySnippet}..."`, true);
  } else {
    item.setAttribute('data-filtered', 'blocked');
    item.style.display = 'none';
    logDebug(`BLOCKED WATCH RECOMMENDATION: "${displaySnippet}..."`, false);
    
    // Increment filtered count
    totalFilteredCount++;
    chrome.storage.local.set({ totalFilteredCount });
  }
}

// Filter shelves (like Shorts)
function filterShelfItem(shelf) {
  if (!filterEnabled) return;
  if (shelf.getAttribute('data-filtered') !== null) return;
  
  const shelfText = (shelf.innerText || shelf.textContent || '').toLowerCase();
  
  // If the shelf content is not loaded yet, wait
  if (shelfText.length < 10) {
    return;
  }
  
  // If it's a Shorts or news shelf, hide it
  if (shelfText.includes('shorts') || shelfText.includes('actualités') || shelfText.includes('breaking news') || shelf.querySelector('ytd-reel-shelf-renderer')) {
    shelf.setAttribute('data-filtered', 'blocked');
    shelf.style.display = 'none';
  } else {
    shelf.setAttribute('data-filtered', 'allowed');
  }
}

// Scans the DOM and applies the filter to all video cards
function applyFilter() {
  if (!filterEnabled) return;
  
  // Skip homepage grid since it uses custom recommendation injection
  if (window.location.pathname === '/') return;
  
  // Filter video cards
  const videoElements = document.querySelectorAll(VIDEO_SELECTORS.join(','));
  videoElements.forEach(filterVideoItem);
  
  // Filter shelves
  const shelfElements = document.querySelectorAll(SHELF_SELECTORS.join(','));
  shelfElements.forEach(filterShelfItem);
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

// -------------------------------------------------------------
// EVENT LISTENERS & OBSERVATION AND INITIALIZATION
// -------------------------------------------------------------

// MutationObserver tracks route changes & dynamically loaded elements
const observer = new MutationObserver(() => {
  // Check if SPA path URL changed
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname;
    handleRouteChange();
    return;
  }
  
  if (!filterEnabled) return;
  
  // Apply standard filters on watch/results pages
  if (window.location.pathname !== '/') {
    applyFilter();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

// Periodic check (every 1 second) to catch route changes or missed elements
setInterval(() => {
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname;
    handleRouteChange();
    return;
  }
  
  if (filterEnabled && window.location.pathname !== '/') {
    applyFilter();
  }
}, 1000);

// Inject sleek "Programming Mode" Toggle switch in YouTube's top masthead
function injectToggleHeader() {
  if (document.getElementById('yt-programming-filter-toggle-container')) return;
  
  const targetHeader = document.querySelector('ytd-masthead #end, ytd-masthead #buttons');
  if (!targetHeader) {
    setTimeout(injectToggleHeader, 500);
    return;
  }
  
  const toggleContainer = document.createElement('div');
  toggleContainer.id = 'yt-programming-filter-toggle-container';
  
  toggleContainer.innerHTML = `
    <span class="yt-prog-label" title="Filters feed to only show programming videos">Dev Mode</span>
    <label class="yt-prog-switch">
      <input type="checkbox" id="yt-programming-filter-checkbox" ${filterEnabled ? 'checked' : ''}>
      <span class="yt-prog-slider"></span>
    </label>
  `;
  
  targetHeader.insertBefore(toggleContainer, targetHeader.firstChild);
  
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
