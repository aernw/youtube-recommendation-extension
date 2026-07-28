// YouTube Feed Controller (YFC) Content Script

let activeMode = localStorage.getItem('yfc_active_mode') || 'normal';
let whitelistKeywords = [];
let totalFilteredCount = 0;
let autoScrollTimer = null;
let isScrolling = false;
let currentPath = window.location.pathname;

// Default keyword lists for all focus modes
const defaultKeywords = {
  programming: [
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
  ],
  productivity: [
    'productivity', 'time management', 'focus', 'deep work', 'life advice', 'habits', 'morning routine', 
    'self improvement', 'discipline', 'organization', 'study methods', 'pomodoro', 'workflow setup', 
    'notion setup', 'planning', 'goals', 'burnout', 'motivation', 'thomas frank', 'ali abdaal', 
    'huberman', 'cal newport', 'james clear', 'reading', 'books summary', 'mindset', 'efficiency', 
    'journaling', 'finance tips', 'wealth building', 'stoicism',
    // French
    'productivité', 'organisation', 'habitudes', 'routines', 'discipline', 'concentration', 
    'motivation', 'conseils de vie', 'developpement personnel', 'apprendre', 'efficacité', 
    'méthode de travail', 'finance personnelle'
  ],
  tech: [
    'tech news', 'new technology', 'cool apps', 'software review', 'gadgets', 'smart home', 
    'future tech', 'ai tools', 'chatgpt', 'midjourney', 'apple vision', 'iphone review', 
    'smartphone', 'linus tech tips', 'marques brownlee', 'mkbhd', 'unbox therapy', 
    'hardware review', 'computex', 'ces 2026', 'graphics card', 'latest gadgets', 'apple event', 
    'tech comparison', 'wearables', 'augmented reality', 'quantum computing',
    // French
    'technologie', 'nouvelles technologies', 'test high tech', 'domotique', 'objets connectés', 
    'gadget intelligent', 'actu tech', 'intelligence artificielle'
  ],
  gaming: [
    'gameplay', 'gaming', 'esports', 'game review', 'playthrough', 'walkthrough game', 
    'twitch highlight', 'speedrun', 'nintendo', 'playstation', 'xbox', 'steam deck', 
    'pc gaming', 'retro gaming', 'minecraft', 'zelda', 'elden ring', 'gta', 'cyberpunk', 
    'assassins creed', 'resident evil', 'halo', 'fortnite', 'league of legends', 'valorant',
    // French
    'jeux vidéo', 'jeu video', 'gameplay fr', 'découverte jeu', 'let\'s play', 'lets play', 
    'squeezie gaming', 'gotaga', 'kameto', 'joueur du grenier'
  ],
  design: [
    'ui design', 'ux design', 'figma tutorial', 'graphic design', 'web design', 'typography', 
    'color theory', 'layout design', 'portfolio review', 'product design', 'interaction design', 
    'wireframing', 'prototyping', 'adobe illustrator', 'photoshop tutorial', 'motion design', 
    'user research', 'information architecture', 'landing page design', 'blender tutorial', 
    '3d design', 'poster design',
    // French
    'design graphique', 'conception ui', 'tutoriel figma', 'webdesign', 'maquette figma'
  ],
  business: [
    'startup', 'saas building', 'indie hacker', 'business model', 'marketing strategy', 
    'venture capital', 'product management', 'entrepreneurship', 'side hustle', 'passive income', 
    'investing tips', 'stocks analysis', 'dropshipping', 'copywriting', 'pitch deck', 
    'founder advice', 'micro-saas', 'solopreneur', 'e-commerce', 'sales funnel',
    // French
    'entrepreneuriat', 'créer sa boîte', 'modèle entreprise', 'marketing numérique', 'investir'
  ],
  science: [
    'science', 'physics tutorial', 'space exploration', 'astrophysics', 'quantum mechanics', 
    'math tutorials', 'chemistry experiments', 'biology lessons', 'history documentary', 
    'philosophy concepts', 'engineering wonders', 'nature documentary', 'kurzgesagt', 
    'veritasium', 'vsauce', 'neil degrass tyson', '3blue1brown', 'destin sandlin', 
    'computer science theory', 'evolution theory', 'universe documentary',
    // French
    'vulgarisation scientifique', 'physique quantique', 'astronomie', 'documentaire science'
  ],
  music: [
    'lo-fi beats', 'lofi study', 'ambient music', 'synthwave mix', 'instrumental beats', 
    'piano chill', 'music for concentration', 'focus music', 'chillhop', 'relaxing beats', 
    'post rock', 'studying playlist', 'lofi hip hop', 'deep focus sounds', 'classical music study',
    // French
    'musique lofi', 'musique pour étudier', 'ambiance détente', 'piano relaxant'
  ],
  travel: [
    'travel vlog', 'solo travel', 'backpacking guide', 'travel documentary', 'budget travel tips', 
    'wanderlust', 'adventure travel', 'explore cities', 'food travel', 'street food vlog', 
    'nomadic life', 'van life vlog', 'travel diary', 'destinations review', 'world tour vlog', 
    'living abroad', 'expat life', 'hiking adventure', 'road trip vlog', 'japan travel vlog', 
    'europe travel guide', 'asia backpacking',
    // French
    'vlog voyage', 'tour du monde', 'voyager seul', 'road trip fr', 'blog voyage', 
    'découverte pays', 'expedition'
  ]
};

// Console debug log helper
function logDebug(message, isAllowed) {
  const color = isAllowed ? '#10b981' : '#ef4444';
  console.log(`%c[YFC] ${message}`, `color: ${color}; font-weight: 500;`);
}

// Initialize settings from storage
chrome.storage.local.get(['activeMode', 'totalFilteredCount'], (result) => {
  activeMode = result.activeMode || 'normal';
  localStorage.setItem('yfc_active_mode', activeMode); // Sync cache
  totalFilteredCount = result.totalFilteredCount || 0;
  
  const storageKey = `keywords_${activeMode}`;
  chrome.storage.local.get([storageKey], (res) => {
    whitelistKeywords = res[storageKey] || defaultKeywords[activeMode] || [];
    
    injectStyles();
    injectToggleHeader();
    
    if (activeMode !== 'normal') {
      handleRouteChange();
    }
  });
});

// Listen for updates from popup or other parts of the extension
chrome.storage.onChanged.addListener((changes) => {
  if (changes.activeMode !== undefined) {
    localStorage.setItem('yfc_active_mode', changes.activeMode.newValue);
    // 2. Automatically reload the page when switching focus mode streams
    window.location.reload();
    return;
  }
  
  // Listen for changes in keywords for the current active mode
  const currentStorageKey = `keywords_${activeMode}`;
  if (changes[currentStorageKey] !== undefined) {
    whitelistKeywords = changes[currentStorageKey].newValue;
    if (activeMode !== 'normal') {
      if (window.location.pathname === '/') {
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

// Injected styling for custom recommendation feed and mode-select dropdown
function injectStyles() {
  if (document.getElementById('yfc-injected-styles')) return;
  const style = document.createElement('style');
  style.id = 'yfc-injected-styles';
  style.textContent = `
    /* Toggle select dropdown styling in YouTube Header */
    #yt-programming-filter-toggle-container {
      display: flex;
      align-items: center;
      margin-right: 16px;
      height: 40px;            /* Fix: Match YouTube's default button heights */
      align-self: center;      /* Fix: Vertically align in header without stretching it */
      font-family: Roboto, Arial, sans-serif;
      user-select: none;
    }
    #yt-yfc-mode-select {
      background-color: var(--yt-spec-badge-chip-background, #2c2c2c);
      color: var(--yt-spec-text-primary, #fff);
      border: 1px solid var(--yt-spec-10-percent-layer, rgba(255,255,255,0.1));
      border-radius: 8px;
      padding: 6px 10px;
      font-family: Roboto, Arial, sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    #yt-yfc-mode-select:hover {
      background-color: var(--yt-spec-button-chip-background-hover, #3e3e3e);
      border-color: #00c6ff;
      box-shadow: 0 0 6px rgba(0, 198, 255, 0.3);
    }
    #yt-yfc-mode-select option {
      background-color: #1f1f1f;
      color: #fff;
    }

    /* Custom Recommendation Grid styles */
    #yfc-feed-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 40px 16px;
      padding: 24px 24px 48px 24px;
      width: 100%;
      box-sizing: border-box;
      margin-top: calc(var(--ytd-masthead-height, 56px) + 24px); /* Clearance for header */
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
      transition: opacity 0.15s ease;
    }
    .dev-video-card:hover .dev-thumb-img {
      opacity: 0.9;
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
      font-size: 16px;
      font-weight: 500;
      line-height: 22px;
      color: var(--yt-spec-text-primary, #fff);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .dev-channel-name {
      font-size: 14px;
      color: var(--yt-spec-text-secondary, #aaa);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }
    .dev-meta-line {
      font-size: 14px;
      color: var(--yt-spec-text-secondary, #aaa);
      line-height: 18px;
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
// HOMEPAGE INJECTION FLOW
// -------------------------------------------------------------

// Routing controller for Single Page Application navigation
function handleRouteChange() {
  const isHomepage = window.location.pathname === '/';
  
  if (isHomepage && activeMode !== 'normal') {
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
    setTimeout(() => setupHomepageGrid(forceRefresh), 200);
    return;
  }
  
  originalGrid.style.display = 'none';
  
  let customGrid = document.getElementById('yfc-feed-grid');
  if (!customGrid) {
    customGrid = document.createElement('div');
    customGrid.id = 'yfc-feed-grid';
    originalGrid.parentNode.insertBefore(customGrid, originalGrid.nextSibling);
  }
  
  if (customGrid.children.length === 0 || forceRefresh) {
    customGrid.innerHTML = '';
    currentOffset = 0;
    await loadInitialRecommendations();
  }
  
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
  
  const customGrid = document.getElementById('yfc-feed-grid');
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
  
  try {
    const keywordsToFetch = getKeywordsToFetch(8);
    const promises = keywordsToFetch.map(kw => fetchVideosForKeyword(kw));
    const results = await Promise.all(promises);
    
    let videos = [];
    let diagnostics = [];
    
    results.forEach((res, i) => {
      const kw = keywordsToFetch[i];
      if (Array.isArray(res)) {
        const valid = res.filter(v => v && v.videoId);
        videos.push(...valid);
        diagnostics.push(`${kw}: Found ${valid.length} videos`);
      } else if (res && res.error) {
        diagnostics.push(`${kw}: Error - ${res.error}`);
      } else {
        diagnostics.push(`${kw}: Unknown response`);
      }
    });
    
    videos = scoreAndRankVideos(videos);
    hideLoadingSpinner();
    
    if (videos.length === 0) {
      const diagnosticMsg = `Could not fetch recommendation content.\n\n` +
                            `Active Mode: ${activeMode}\n` +
                            `Keywords used: ${keywordsToFetch.join(', ')}\n\n` +
                            `Diagnostics:\n${diagnostics.join('\n')}`;
      showEmptyMessage(diagnosticMsg);
      return;
    }
    
    renderVideoCards(videos);
  } catch (err) {
    hideLoadingSpinner();
    showEmptyMessage(`Internal Error: ${err.message}\n${err.stack}`);
  }
}

// Load more recommendations on scroll
async function loadMoreRecommendations() {
  if (isScrolling) return;
  isScrolling = true;
  
  const customGrid = document.getElementById('yfc-feed-grid');
  if (!customGrid) {
    isScrolling = false;
    return;
  }
  
  const bottomSpinner = document.createElement('div');
  bottomSpinner.className = 'dev-spinner';
  bottomSpinner.style.padding = '30px 0';
  bottomSpinner.innerHTML = `<div class="dev-spinner-circle"></div>`;
  customGrid.appendChild(bottomSpinner);
  
  try {
    // Select another 4 keywords to fetch next batch
    const keywordsToFetch = getKeywordsToFetch(4);
    const promises = keywordsToFetch.map(kw => fetchVideosForKeyword(kw));
    const results = await Promise.all(promises);
    
    let newVideos = results.flat().filter(v => v !== null && typeof v === 'object' && v.videoId);
    newVideos = scoreAndRankVideos(newVideos);
    
    if (newVideos.length > 0) {
      renderVideoCards(newVideos);
    }
  } catch (err) {
    console.error("YFC: Failed to load more recommendations:", err);
  } finally {
    bottomSpinner.remove();
    isScrolling = false;
  }
}

// Infinite scroll trigger
function handleInfiniteScroll() {
  if (activeMode === 'normal' || isScrolling) return;
  
  const customGrid = document.getElementById('yfc-feed-grid');
  if (!customGrid) return;
  
  const rect = customGrid.getBoundingClientRect();
  if (rect.bottom < window.innerHeight * 1.5) {
    loadMoreRecommendations();
  }
}

// Formulate search queries based on the active stream mode
function getTargetedQuery(keyword) {
  const kw = keyword.toLowerCase().trim();
  
  if (activeMode === 'programming') {
    const searchModifiers = [
      'tips and tricks workflow',
      'best practices architecture',
      'new features trends',
      'tools setup productivity',
      'real world application project',
      'comparison review recommendation'
    ];
    if (kw.includes('tips') || kw.includes('practices') || kw.includes('new') || kw.includes('tools') || kw.includes('setup') || kw.includes('workflow')) {
      return keyword;
    }
    const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
    return `${keyword} ${modifier}`;
  }
  
  if (activeMode === 'productivity') {
    const searchModifiers = [
      'systems workflow',
      'habits methods routines',
      'tips guides productivity',
      'deep work planning setup'
    ];
    if (kw.includes('productivity') || kw.includes('habits') || kw.includes('workflow') || kw.includes('focus')) {
      return keyword;
    }
    const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
    return `${keyword} ${modifier}`;
  }
  
  if (activeMode === 'tech') {
    const searchModifiers = [
      'review hands on test',
      'unbox review smart',
      'latest features review',
      'tech news future gadgets'
    ];
    if (kw.includes('review') || kw.includes('tech') || kw.includes('news') || kw.includes('gadgets')) {
      return keyword;
    }
    const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
    return `${keyword} ${modifier}`;
  }
  
  if (activeMode === 'gaming') {
    const searchModifiers = [
      'gameplay review test',
      'playthrough walkthrough highlights',
      'game review analysis',
      'lets play walkthrough'
    ];
    if (kw.includes('gameplay') || kw.includes('review') || kw.includes('playthrough')) {
      return keyword;
    }
    const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
    return `${keyword} ${modifier}`;
  }
  
  if (activeMode === 'design') {
    const searchModifiers = [
      'workflow design figma',
      'ui ux layout tips',
      'portfolio review graphics',
      'web app design guidelines'
    ];
    if (kw.includes('design') || kw.includes('ui') || kw.includes('ux') || kw.includes('figma')) {
      return keyword;
    }
    const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
    return `${keyword} ${modifier}`;
  }
  
  if (activeMode === 'business') {
    const searchModifiers = [
      'startup marketing strategy',
      'saas indie hacker sales',
      'business model ideas founder',
      'finance trends entrepreneur'
    ];
    if (kw.includes('startup') || kw.includes('business') || kw.includes('saas') || kw.includes('founder')) {
      return keyword;
    }
    const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
    return `${keyword} ${modifier}`;
  }
  
  if (activeMode === 'science') {
    const searchModifiers = [
      'documentary cosmic learn',
      'physics quantum math wonders',
      'scientific theory breakthrough',
      'education concept crash course'
    ];
    if (kw.includes('science') || kw.includes('physics') || kw.includes('documentary') || kw.includes('theory')) {
      return keyword;
    }
    const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
    return `${keyword} ${modifier}`;
  }
  
  if (activeMode === 'music') {
    const searchModifiers = [
      'chill study lo-fi beats',
      'ambient synthwave focus music',
      'relaxing instrumentals piano mix',
      'studying playlist concentration'
    ];
    if (kw.includes('lofi') || kw.includes('ambient') || kw.includes('music') || kw.includes('chill')) {
      return keyword;
    }
    const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
    return `${keyword} ${modifier}`;
  }
  
  if (activeMode === 'travel') {
    const searchModifiers = [
      'vlog travel adventure',
      'backpacking guide tips',
      'documentary food explore',
      'road trip destination diary'
    ];
    if (kw.includes('travel') || kw.includes('vlog') || kw.includes('voyage') || kw.includes('guide')) {
      return keyword;
    }
    const modifier = searchModifiers[Math.floor(Math.random() * searchModifiers.length)];
    return `${keyword} ${modifier}`;
  }
  
  return keyword;
}

// Fetch search results and parse elements in background
async function fetchVideosForKeyword(keyword) {
  const query = getTargetedQuery(keyword);
  try {
    logDebug(`Fetching fresh recommendations for [${activeMode}]: "${query}"...`, true);
    const response = await fetch(`/results?search_query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      return { error: `HTTP ${response.status} ${response.statusText}` };
    }
    const html = await response.text();
    
    const ytInitialData = parseYtInitialData(html);
    if (!ytInitialData) {
      return { error: `Could not parse ytInitialData (HTML length: ${html.length})` };
    }
    
    const renderers = findVideoRenderers(ytInitialData);
    return renderers.map(extractVideoData).filter(v => v !== null);
  } catch (err) {
    console.error(`YFC failed to fetch results for ${keyword}:`, err);
    return { error: err.message || err.toString() };
  }
}

// Extract essential items from ytInitialData payload with more robust matching
function parseYtInitialData(html) {
  const match = html.match(/ytInitialData\s*=\s*({.*?})(?:;|<\/script>)/s) || html.match(/ytInitialData\s*=\s*({.*?})/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    return null;
  }
}

// Recursively parse JSON structure to extract video renderers
// Helper to check if a videoRenderer is a promoted ad
function isPromotedAd(renderer) {
  if (renderer.badges) {
    const hasAdBadge = renderer.badges.some(b => {
      const badge = b.metadataBadgeRenderer;
      if (!badge) return false;
      
      const style = badge.style || '';
      const label = (badge.label || '').toLowerCase();
      
      return style.includes('AD') || label.includes('ad') || label.includes('annonce') || label.includes('sponsor');
    });
    if (hasAdBadge) return true;
  }
  return false;
}

// Recursively parse JSON structure to extract video renderers
function findVideoRenderers(obj) {
  const renderers = [];
  const adKeys = ['adSlotRenderer', 'promotedSparklesWebRenderer', 'adPlacementRenderer', 'adPlacement', 'adRenderer'];
  
  function traverse(item) {
    if (!item || typeof item !== 'object') return;
    
    if (item.videoRenderer) {
      if (!isPromotedAd(item.videoRenderer)) {
        renderers.push(item.videoRenderer);
      }
      return;
    }
    
    for (const key in item) {
      if (item.hasOwnProperty(key)) {
        if (adKeys.includes(key)) {
          continue; // Skip traversing promoted ad blocks
        }
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

// Check if a video's publication age exceeds 3 years
function isOlderThanThreeYears(timeStr) {
  if (!timeStr) return false;
  const str = timeStr.toLowerCase();
  
  if (str.includes('year') || str.includes('an')) {
    const match = str.match(/(\d+)/);
    if (match) {
      const years = parseInt(match[1]);
      return years > 3; // Block anything older than 3 years (e.g. 4 years, 5 years, etc.)
    }
  }
  return false;
}

// Check if a video is a massive reference lecture course to filter them down
function isMassiveCourse(title, durationSec) {
  const t = title.toLowerCase();
  const courseKeywords = [
    'full course', 'cours complet', 'course for free', 'complete course', 
    'complete tutorial for beginners', 'aprende depuis zero', 
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
    
    // Extracted actual channel avatar picture URL (supporting both desktop and mobile schemas)
    const channelAvatar = renderer.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url || renderer.channelThumbnail?.thumbnails?.[0]?.url || '';
    
    const channelName = renderer.longBylineText?.runs?.[0]?.text || renderer.longBylineText?.simpleText || '';
    const publishedTime = renderer.publishedTimeText?.simpleText || '';
    const viewCount = renderer.viewCountText?.simpleText || renderer.viewCountText?.runs?.[0]?.text || '';
    const duration = renderer.lengthText?.simpleText || '';
    
    if (!title) return null;
    
    const durationSec = parseDurationToSeconds(duration);
    
    // Exclude YouTube Shorts (videos shorter than 60 seconds)
    if (duration && durationSec < 60) {
      return null;
    }
    
    // Exclude videos older than 3 years
    if (isOlderThanThreeYears(publishedTime)) {
      return null;
    }
    
    // Exclude massive "Full Course" tutorials (> 1.5 hours)
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
  const grid = document.getElementById('yfc-feed-grid');
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
    const diff = count - list.length;
    const modeDefaults = defaultKeywords[activeMode] || [];
    const availableDefaults = modeDefaults.filter(k => !list.includes(k));
    const extra = [];
    const temp = [...availableDefaults];
    for (let i = 0; i < Math.min(diff, availableDefaults.length); i++) {
      const idx = Math.floor(Math.random() * temp.length);
      extra.push(temp.splice(idx, 1)[0]);
    }
    list = [...list, ...extra];
  }
  
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
  if (!viewStr) return 1000;
  
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
      if (years >= 5) return 0.01;
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
  const grid = document.getElementById('yfc-feed-grid');
  if (!grid) return;
  
  const spinner = document.createElement('div');
  spinner.id = 'yfc-spinner';
  spinner.className = 'dev-spinner';
  spinner.innerHTML = `
    <div class="dev-spinner-circle"></div>
    <span class="dev-spinner-text">Personalizing your ${activeMode} feed...</span>
  `;
  grid.appendChild(spinner);
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('yfc-spinner');
  if (spinner) spinner.remove();
}

// Display empty feedback
function showEmptyMessage(msgText) {
  const grid = document.getElementById('yfc-feed-grid');
  if (!grid) return;
  
  const msg = document.createElement('div');
  msg.className = 'dev-empty-msg';
  msg.textContent = msgText;
  grid.appendChild(msg);
}

// -------------------------------------------------------------
// STANDARD FEED FILTERING FLOW (USED ON WATCH / SEARCH RESULTS PAGES)
// -------------------------------------------------------------

// Check if a text contains any of our active mode keywords
function matchesKeywords(text, keywords) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  return keywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase().trim();
    if (!lowerKeyword) return false;
    
    if (lowerKeyword.length <= 3) {
      let escapedKeyword = lowerKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      let pattern = `\\b${escapedKeyword}\\b`;
      if (lowerKeyword.includes('+') || lowerKeyword.includes('#')) {
        pattern = `(?:^|\\s|[\\.,!\\?\\(\\)\\[\\]{}\\-])${escapedKeyword}(?:$|\\s|[\\.,!\\?\\(\\)\\[\\]{}\\-])`;
      }
      const regex = new RegExp(pattern);
      return regex.test(lowerText);
    }
    
    return lowerText.includes(lowerKeyword);
  });
}

// Selectors for banner, sidebar and video frame ads
const AD_SELECTORS = [
  'ytd-companion-ad-renderer',
  'ytd-display-ad-renderer',
  'ytd-promoted-sparkles-web-renderer',
  'ytd-promoted-video-renderer',
  'ytd-player-legacy-advertisment-renderer',
  'ytd-action-companion-ad-renderer',
  '#player-ads',
  '#masthead-ad',
  'ytd-ad-slot-renderer',
  'ytd-brand-video-singleton-renderer'
];

// Helper to identify promoted ad cards using innerText
function hasAdText(text) {
  const t = text.toLowerCase();
  const adIndicators = ['annonce', 'sponsored', 'sponsorisé', 'promoted', 'sponsorise'];
  if (adIndicators.some(ind => t.includes(ind))) return true;
  
  const words = t.split(/\s+/);
  return words.includes('ad');
}

// Skip video pre-roll/mid-roll player ads instantly
function skipPlayerVideoAds() {
  const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
  if (!player) return;
  
  const isAdShowing = player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting');
  const video = player.querySelector('video');
  
  if (isAdShowing && video) {
    if (!video.muted) {
      video.muted = true;
    }
    if (video.playbackRate !== 16) {
      video.playbackRate = 16;
    }
    if (video.duration && !isNaN(video.duration) && video.currentTime < video.duration - 0.2) {
      video.currentTime = video.duration - 0.1;
    }
  }
  
  const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-slot');
  if (skipBtn) {
    skipBtn.click();
  }
}

// Hide banner and sidebar ads on watch/results pages
function hideDisplayAds() {
  const ads = document.querySelectorAll(AD_SELECTORS.join(','));
  ads.forEach(ad => {
    if (ad.style.display !== 'none') {
      ad.style.display = 'none';
    }
  });
}

// Function to filter a single video item using innerText to penetrate Shadow DOM
function filterVideoItem(item) {
  if (activeMode === 'normal') return;
  if (item.getAttribute('data-filtered') !== null) return;
  
  const cardText = (item.innerText || item.textContent || '').trim();
  if (cardText.length < 10) return;
  
  // Exclude promoted video cards (ads) in recommendations list
  if (hasAdText(cardText)) {
    item.setAttribute('data-filtered', 'blocked');
    item.style.display = 'none';
    logDebug(`BLOCKED PROMOTED RECOMMENDATION CARD: "${cardText.substring(0, 50)}..."`, false);
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
    
    totalFilteredCount++;
    chrome.storage.local.set({ totalFilteredCount });
  }
}

// Filter shelves (like Shorts)
function filterShelfItem(shelf) {
  if (activeMode === 'normal') return;
  if (shelf.getAttribute('data-filtered') !== null) return;
  
  const shelfText = (shelf.innerText || shelf.textContent || '').toLowerCase();
  if (shelfText.length < 10) return;
  
  if (shelfText.includes('shorts') || shelfText.includes('actualités') || shelfText.includes('breaking news') || shelf.querySelector('ytd-reel-shelf-renderer')) {
    shelf.setAttribute('data-filtered', 'blocked');
    shelf.style.display = 'none';
  } else {
    shelf.setAttribute('data-filtered', 'allowed');
  }
}

// Scans the DOM and applies the filter to all video cards
function applyFilter() {
  if (activeMode === 'normal') return;
  
  // Hide display ads and skip player ads whenever active
  hideDisplayAds();
  skipPlayerVideoAds();
  
  if (window.location.pathname === '/') return;
  
  const videoElements = document.querySelectorAll(VIDEO_SELECTORS.join(','));
  videoElements.forEach(filterVideoItem);
  
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
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname;
    handleRouteChange();
    return;
  }
  
  if (activeMode === 'normal') return;
  
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
  
  if (activeMode !== 'normal' && window.location.pathname !== '/') {
    applyFilter();
  }
}, 1000);

// Inject sleek select dropdown in YouTube's top masthead
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
    <select id="yt-yfc-mode-select">
      <option value="normal" ${activeMode === 'normal' ? 'selected' : ''}>Standard Feed</option>
      <option value="programming" ${activeMode === 'programming' ? 'selected' : ''}>👨‍💻 Programming</option>
      <option value="productivity" ${activeMode === 'productivity' ? 'selected' : ''}>🎯 Productivity</option>
      <option value="tech" ${activeMode === 'tech' ? 'selected' : ''}>⚡ Tech & Apps</option>
      <option value="gaming" ${activeMode === 'gaming' ? 'selected' : ''}>🎮 Gaming Feed</option>
      <option value="design" ${activeMode === 'design' ? 'selected' : ''}>🎨 Design & UX</option>
      <option value="business" ${activeMode === 'business' ? 'selected' : ''}>💼 Business & SaaS</option>
      <option value="science" ${activeMode === 'science' ? 'selected' : ''}>🔬 Science & Learn</option>
      <option value="music" ${activeMode === 'music' ? 'selected' : ''}>🎵 Music & Chill</option>
      <option value="travel" ${activeMode === 'travel' ? 'selected' : ''}>✈️ Travel & Vlogs</option>
    </select>
  `;
  
  targetHeader.insertBefore(toggleContainer, targetHeader.firstChild);
  
  const select = document.getElementById('yt-yfc-mode-select');
  select.addEventListener('change', (e) => {
    const mode = e.target.value;
    chrome.storage.local.set({ activeMode: mode });
  });
}

function updateHeaderToggleUI() {
  const select = document.getElementById('yt-yfc-mode-select');
  if (select) {
    select.value = activeMode;
  }
}

// Clean any third-party ads injected directly into our custom grid DOM
function cleanCustomGridAds() {
  const grid = document.getElementById('yfc-feed-grid');
  if (!grid) return;
  
  const children = Array.from(grid.children);
  children.forEach(child => {
    if (!child.classList.contains('dev-video-card') && 
        !child.classList.contains('dev-spinner') && 
        !child.classList.contains('dev-empty-msg')) {
      logDebug(`REMOVED INJECTED AD FROM GRID: <${child.tagName.toLowerCase()}>`, false);
      child.remove();
    }
  });
}

// Run the ad skipper once immediately on script load
if (activeMode !== 'normal') {
  if (window.location.pathname.includes('/watch')) {
    skipPlayerVideoAds();
  }
  hideDisplayAds();
}

// Fast checker (every 100ms) for skipping video player ads and cleaning grid ads instantly
setInterval(() => {
  if (activeMode !== 'normal') {
    if (window.location.pathname.includes('/watch')) {
      skipPlayerVideoAds();
    }
    hideDisplayAds();
    if (window.location.pathname === '/') {
      cleanCustomGridAds();
    }
  }
}, 100);
