// YouTube DevFilter Popup script

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

let currentKeywords = [];

// DOM Elements
const masterToggle = document.getElementById('masterToggle');
const statusIndicator = document.getElementById('statusIndicator');
const statsCount = document.getElementById('statsCount');
const resetBtn = document.getElementById('resetBtn');
const addKeywordForm = document.getElementById('addKeywordForm');
const newKeywordInput = document.getElementById('newKeywordInput');
const keywordsContainer = document.getElementById('keywordsContainer');

// Load settings on popup open
document.addEventListener('DOMContentLoaded', async () => {
  chrome.storage.local.get(['filterEnabled', 'keywords', 'totalFilteredCount'], (result) => {
    const filterEnabled = result.filterEnabled !== undefined ? result.filterEnabled : false;
    currentKeywords = result.keywords || defaultKeywords;
    const count = result.totalFilteredCount || 0;

    // Apply to UI
    masterToggle.checked = filterEnabled;
    statsCount.textContent = count.toLocaleString();
    updateStatusIndicator(filterEnabled);
    renderKeywords();
  });
});

// Handle master toggle change
masterToggle.addEventListener('change', (e) => {
  const isEnabled = e.target.checked;
  chrome.storage.local.set({ filterEnabled: isEnabled });
  updateStatusIndicator(isEnabled);
});

// Update status panel styling based on filter state
function updateStatusIndicator(enabled) {
  const statusLabel = statusIndicator.querySelector('.status-label');
  if (enabled) {
    statusIndicator.classList.remove('inactive');
    statusLabel.textContent = 'Active';
  } else {
    statusIndicator.classList.add('inactive');
    statusLabel.textContent = 'Disabled';
  }
}

// Render keyword chips in container
function renderKeywords() {
  keywordsContainer.innerHTML = '';
  
  // Sort alphabetically
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
    chrome.storage.local.set({ keywords: currentKeywords }, () => {
      renderKeywords();
      newKeywordInput.value = '';
    });
  }
});

// Remove a keyword
function removeKeyword(kw) {
  currentKeywords = currentKeywords.filter(k => k !== kw);
  chrome.storage.local.set({ keywords: currentKeywords }, () => {
    renderKeywords();
  });
}

// Reset to default keywords
resetBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset to the default programming keywords?')) {
    currentKeywords = [...defaultKeywords];
    chrome.storage.local.set({ keywords: currentKeywords }, () => {
      renderKeywords();
    });
  }
});
