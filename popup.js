// YouTube DevStream Multi-Mode Control Panel controller

// Default keywords for all focus modes
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
    // French
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
  ]
};

// Mode metadata mapping
const modeDetails = {
  normal: {
    title: "Standard Feed Active",
    desc: "Default recommendations are active. Select a focus mode tab above to filter recommendations."
  },
  programming: {
    title: "👨‍💻 Programming Feed Active",
    desc: "Seeds your YouTube homepage with tips, workflows, technology trends, and coding guides."
  },
  productivity: {
    title: "🎯 Productivity Feed Active",
    desc: "Feeds your homepage with study methods, focus tips, life advice, and time management guides."
  },
  tech: {
    title: "⚡ Tech Trends Feed Active",
    desc: "Seeds your homepage with consumer gadget reviews, tech news, and app guides (non-developer)."
  },
  gaming: {
    title: "🎮 Gaming Feed Active",
    desc: "Seeds your homepage with gameplay walkthroughs, highlights, and game reviews."
  }
};

let activeMode = 'normal';
let currentKeywords = [];

// DOM Elements
const modeTabs = document.querySelectorAll('.mode-tab');
const statusIndicator = document.getElementById('statusIndicator');
const currentModeTitle = document.getElementById('currentModeTitle');
const currentModeDesc = document.getElementById('currentModeDesc');
const normalInfoCard = document.getElementById('normalInfoCard');
const keywordsCard = document.getElementById('keywordsCard');
const statsCard = document.getElementById('statsCard');
const statsCount = document.getElementById('statsCount');
const resetBtn = document.getElementById('resetBtn');
const addKeywordForm = document.getElementById('addKeywordForm');
const newKeywordInput = document.getElementById('newKeywordInput');
const keywordsContainer = document.getElementById('keywordsContainer');

// Load configurations on startup
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['activeMode', 'totalFilteredCount'], (result) => {
    activeMode = result.activeMode || 'normal';
    const count = result.totalFilteredCount || 0;
    
    // Set UI indicators
    statsCount.textContent = count.toLocaleString();
    updateTabSelection(activeMode);
    updateModeSummary(activeMode);
    
    if (activeMode !== 'normal') {
      loadModeKeywords(activeMode);
    }
  });
});

// Setup tab navigation clicks
modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const selectedMode = tab.getAttribute('data-mode');
    if (selectedMode === activeMode) return;
    
    activeMode = selectedMode;
    
    // Save to storage
    chrome.storage.local.set({ activeMode: selectedMode }, () => {
      updateTabSelection(selectedMode);
      updateModeSummary(selectedMode);
      
      if (selectedMode !== 'normal') {
        loadModeKeywords(selectedMode);
      }
    });
  });
});

// Update tab styling selection in popup UI
function updateTabSelection(mode) {
  modeTabs.forEach(tab => {
    if (tab.getAttribute('data-mode') === mode) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// Update text summaries and toggling card visibility
function updateModeSummary(mode) {
  const details = modeDetails[mode];
  currentModeTitle.textContent = details.title;
  currentModeDesc.textContent = details.desc;
  
  const statusLabel = statusIndicator.querySelector('.status-label');
  if (mode !== 'normal') {
    statusIndicator.classList.remove('inactive');
    statusLabel.textContent = 'Active';
    
    normalInfoCard.classList.add('hidden');
    keywordsCard.classList.remove('hidden');
    statsCard.classList.remove('hidden');
  } else {
    statusIndicator.classList.add('inactive');
    statusLabel.textContent = 'Disabled';
    
    normalInfoCard.classList.remove('hidden');
    keywordsCard.classList.add('hidden');
    statsCard.classList.add('hidden');
  }
}

// Load keywords list matching the selected tab
function loadModeKeywords(mode) {
  const storageKey = `keywords_${mode}`;
  chrome.storage.local.get([storageKey], (result) => {
    currentKeywords = result[storageKey] || defaultKeywords[mode] || [];
    renderKeywordChips();
  });
}

// Render keyword chips inside grid
function renderKeywordChips() {
  keywordsContainer.innerHTML = '';
  const sortedKeywords = [...currentKeywords].sort();
  
  sortedKeywords.forEach(kw => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = kw;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'chip-remove';
    removeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    removeBtn.title = `Remove "${kw}"`;
    removeBtn.addEventListener('click', () => removeKeyword(kw));
    
    chip.appendChild(removeBtn);
    keywordsContainer.appendChild(chip);
  });
}

// Add a keyword
addKeywordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const kw = newKeywordInput.value.trim().toLowerCase();
  
  if (kw && !currentKeywords.includes(kw)) {
    currentKeywords.push(kw);
    const storageKey = `keywords_${activeMode}`;
    chrome.storage.local.set({ [storageKey]: currentKeywords }, () => {
      renderKeywordChips();
      newKeywordInput.value = '';
    });
  }
});

// Remove a keyword
function removeKeyword(kw) {
  currentKeywords = currentKeywords.filter(k => k !== kw);
  const storageKey = `keywords_${activeMode}`;
  chrome.storage.local.set({ [storageKey]: currentKeywords }, () => {
    renderKeywordChips();
  });
}

// Reset to default keywords for the current active mode tab
resetBtn.addEventListener('click', () => {
  if (confirm(`Reset keywords list for ${activeMode.toUpperCase()} to defaults?`)) {
    currentKeywords = [...defaultKeywords[activeMode]];
    const storageKey = `keywords_${activeMode}`;
    chrome.storage.local.set({ [storageKey]: currentKeywords }, () => {
      renderKeywordChips();
    });
  }
});
