// Application State
let state = {
    updates: [],
    selectedUpdate: null,
    activeFilter: 'all',
    searchQuery: ''
};

// DOM Elements
const btnRefresh = document.getElementById('btn-refresh');
const btnExport = document.getElementById('btn-export');
const btnRetry = document.getElementById('btn-retry');

// Theme Elements
const themeToggle = document.getElementById('theme-toggle');
const themeIconMoon = document.getElementById('theme-icon-moon');
const themeIconSun = document.getElementById('theme-icon-sun');
const feedList = document.getElementById('feed-list');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const filterPills = document.querySelectorAll('.pill');

// Stats Elements
const statTotal = document.getElementById('stat-total').querySelector('.stat-value');
const statFeatures = document.getElementById('stat-features').querySelector('.stat-value');
const statChanges = document.getElementById('stat-changes').querySelector('.stat-value');
const statBreaking = document.getElementById('stat-breaking').querySelector('.stat-value');

// Composer Elements
const composerEmptyView = document.getElementById('composer-empty-view');
const composerEditor = document.getElementById('composer-editor');
const composerBadge = document.getElementById('composer-badge');
const composerDate = document.getElementById('composer-date');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCount = document.getElementById('char-count');
const charProgress = document.getElementById('char-progress');
const btnTweet = document.getElementById('btn-tweet');
const btnCopy = document.getElementById('btn-copy');
const btnRevert = document.getElementById('btn-revert');
const composerLink = document.getElementById('composer-link');
const toast = document.getElementById('toast');

// Twitter Link Calculation constants
const TWITTER_MAX_CHARS = 280;
const T_CO_URL_LENGTH = 23; // Twitter wraps all URLs in a 23-char t.co link

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    initTheme();
    setupEventListeners();
    fetchReleases();
    initProgressRing();
}

// Progress Ring Configuration
const ringRadius = 16;
const ringCircumference = 2 * Math.PI * ringRadius;

function initProgressRing() {
    charProgress.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    charProgress.style.strokeDashoffset = ringCircumference;
}

function updateProgressRing(percent, isOverLimit) {
    const offset = ringCircumference - (percent / 100 * ringCircumference);
    charProgress.style.strokeDashoffset = Math.max(0, offset);
    
    if (isOverLimit) {
        charProgress.style.stroke = '#ef4444'; // Red
    } else if (percent > 85) {
        charProgress.style.stroke = '#f59e0b'; // Orange
    } else {
        charProgress.style.stroke = '#00f2fe'; // Cyan/Blue
    }
}

// Event Listeners Setup
function setupEventListeners() {
    btnRefresh.addEventListener('click', fetchReleases);
    btnRetry.addEventListener('click', fetchReleases);
    btnExport.addEventListener('click', exportToCSV);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Search
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    });

    // Filter pills
    filterPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.activeFilter = pill.getAttribute('data-filter');
            renderFeed();
        });
    });

    // Textarea Changes
    tweetTextarea.addEventListener('input', handleComposerTextChange);

    // Revert Text
    btnRevert.addEventListener('click', () => {
        if (state.selectedUpdate) {
            tweetTextarea.value = state.selectedUpdate.tweet_text;
            handleComposerTextChange();
            showToast('Reset to draft version');
        }
    });

    // Copy to Clipboard
    btnCopy.addEventListener('click', () => {
        const text = tweetTextarea.value;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    });
}

// Fetch Release Notes
async function fetchReleases() {
    // UI state updates
    btnRefresh.classList.add('loading');
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    feedList.classList.add('hidden');
    emptyState.classList.add('hidden');
    
    // Reset selections
    state.selectedUpdate = null;
    updateComposerUI();

    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`Server returned status code ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            state.updates = data.updates;
            renderFeed();
            updateStats();
        } else {
            throw new Error(data.message || 'Failed to fetch release notes.');
        }
    } catch (err) {
        console.error(err);
        errorMessage.textContent = err.message || 'Unable to connect to the server.';
        errorState.classList.remove('hidden');
        loadingState.classList.add('hidden');
    } finally {
        btnRefresh.classList.remove('loading');
    }
}

// Update Dashboard Statistics
function updateStats() {
    if (!state.updates || state.updates.length === 0) {
        statTotal.textContent = '0';
        statFeatures.textContent = '0';
        statChanges.textContent = '0';
        statBreaking.textContent = '0';
        return;
    }

    const total = state.updates.length;
    const features = state.updates.filter(u => u.type.toLowerCase() === 'feature').length;
    const changes = state.updates.filter(u => u.type.toLowerCase() === 'change').length;
    const breaking = state.updates.filter(u => {
        const type = u.type.toLowerCase();
        return type === 'breaking' || type === 'issue';
    }).length;

    statTotal.textContent = total;
    statFeatures.textContent = features;
    statChanges.textContent = changes;
    statBreaking.textContent = breaking;
}

// Render Feed items
function renderFeed() {
    loadingState.classList.add('hidden');
    feedList.classList.remove('hidden');
    
    // Filter updates
    let filteredUpdates = state.updates.filter(update => {
        // Keyword Search filter
        const matchesSearch = 
            update.clean_text.toLowerCase().includes(state.searchQuery) ||
            update.type.toLowerCase().includes(state.searchQuery) ||
            update.date.toLowerCase().includes(state.searchQuery);
        
        // Category pill filter
        let matchesFilter = true;
        if (state.activeFilter !== 'all') {
            if (state.activeFilter === 'Breaking') {
                matchesFilter = update.type === 'Breaking' || update.type === 'Issue';
            } else {
                matchesFilter = update.type === state.activeFilter;
            }
        }

        return matchesSearch && matchesFilter;
    });

    // Check if empty
    if (filteredUpdates.length === 0) {
        feedList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    // Group filtered updates by Date
    const grouped = {};
    filteredUpdates.forEach(update => {
        if (!grouped[update.date]) {
            grouped[update.date] = [];
        }
        grouped[update.date].push(update);
    });

    // Generate HTML
    feedList.innerHTML = '';
    
    for (const date in grouped) {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';
        
        const title = document.createElement('div');
        title.className = 'date-group-title';
        title.textContent = date;
        dateGroup.appendChild(title);
        
        grouped[date].forEach(update => {
            const card = document.createElement('div');
            // Add custom modifier classes based on type for border accent on selection
            const typeClass = getCardTypeClass(update.type);
            card.className = `update-card ${typeClass}`;
            card.dataset.id = update.id;
            
            if (state.selectedUpdate && state.selectedUpdate.id === update.id) {
                card.classList.add('active');
            }
            
            const badgeClass = getBadgeClass(update.type);
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="header-left">
                        <span class="badge ${badgeClass}">${update.type}</span>
                        <span class="card-date">${update.date}</span>
                    </div>
                    <button class="card-copy-btn" title="Copy this update text" data-id="${update.id}">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                <div class="card-body">
                    ${update.html}
                </div>
            `;
            
            // Add Copy Event to the button inside header
            const copyBtn = card.querySelector('.card-copy-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent card selection trigger
                navigator.clipboard.writeText(update.clean_text).then(() => {
                    showToast('Update text copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            });
            
            // Add Selection Event
            card.addEventListener('click', () => {
                document.querySelectorAll('.update-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                selectUpdate(update);
            });
            
            dateGroup.appendChild(card);
        });
        
        feedList.appendChild(dateGroup);
    }
}

// Map types to card styles
function getCardTypeClass(type) {
    const t = type.toLowerCase();
    if (t === 'feature') return 'feature-card';
    if (t === 'change') return 'change-card';
    if (t === 'breaking') return 'breaking-card';
    if (t === 'announcement') return 'announcement-card';
    if (t === 'issue') return 'issue-card';
    return 'update-card-type';
}

// Map types to badge CSS classes
function getBadgeClass(type) {
    const t = type.toLowerCase();
    if (t === 'feature') return 'badge-feature';
    if (t === 'change') return 'badge-change';
    if (t === 'breaking') return 'badge-breaking';
    if (t === 'announcement') return 'badge-announcement';
    if (t === 'issue') return 'badge-issue';
    return 'badge-update';
}

// Handle Update Selection
function selectUpdate(update) {
    state.selectedUpdate = update;
    updateComposerUI();
}

// Update Composer Sidebar
function updateComposerUI() {
    if (!state.selectedUpdate) {
        composerEmptyView.classList.remove('hidden');
        composerEditor.classList.add('hidden');
        return;
    }
    
    composerEmptyView.classList.add('hidden');
    composerEditor.classList.remove('hidden');
    
    // Set Header
    composerBadge.className = `badge ${getBadgeClass(state.selectedUpdate.type)}`;
    composerBadge.textContent = state.selectedUpdate.type;
    composerDate.textContent = state.selectedUpdate.date;
    
    // Set Textarea content
    tweetTextarea.value = state.selectedUpdate.tweet_text;
    
    // Set Documentation Link
    if (state.selectedUpdate.link) {
        composerLink.href = state.selectedUpdate.link;
        composerLink.classList.remove('hidden');
    } else {
        composerLink.classList.add('hidden');
    }

    // Update character counters
    handleComposerTextChange();
}

// Calculate tweet length considering Twitter's URL shortening policy
function calculateTweetLength(text) {
    // Find all HTTP/HTTPS links in the text
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    
    // Replace all URLs with a placeholder of T_CO_URL_LENGTH characters
    let lengthWithoutUrls = text.replace(urlRegex, '').length;
    
    // Twitter charges exactly T_CO_URL_LENGTH (23) chars for each link, plus any spacing
    const totalUrlLength = urls.length * T_CO_URL_LENGTH;
    
    return lengthWithoutUrls + totalUrlLength;
}

// Handle changes inside composer textarea
function handleComposerTextChange() {
    const text = tweetTextarea.value;
    const currentLength = calculateTweetLength(text);
    const charsRemaining = TWITTER_MAX_CHARS - currentLength;
    
    // Set counter text
    charCount.textContent = charsRemaining;
    
    // Danger/warning classes
    charCount.classList.remove('warning', 'danger');
    if (charsRemaining < 0) {
        charCount.classList.add('danger');
    } else if (charsRemaining < 30) {
        charCount.classList.add('warning');
    }

    // Set Progress Ring
    const percentage = Math.min(100, (currentLength / TWITTER_MAX_CHARS) * 100);
    const isOverLimit = charsRemaining < 0;
    updateProgressRing(percentage, isOverLimit);

    // Update Tweet Action Link
    if (charsRemaining >= 0 && text.trim().length > 0) {
        const encodedText = encodeURIComponent(text);
        btnTweet.href = `https://twitter.com/intent/tweet?text=${encodedText}`;
        btnTweet.classList.remove('disabled');
        btnTweet.style.pointerEvents = 'auto';
    } else {
        btnTweet.removeAttribute('href');
        btnTweet.classList.add('disabled');
        btnTweet.style.pointerEvents = 'none';
    }
}

// Toast Notifications Helper
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2500);
}

// Export Filtered Updates to CSV
function exportToCSV() {
    // Get currently filtered list
    const filteredUpdates = state.updates.filter(update => {
        const matchesSearch = 
            update.clean_text.toLowerCase().includes(state.searchQuery) ||
            update.type.toLowerCase().includes(state.searchQuery) ||
            update.date.toLowerCase().includes(state.searchQuery);
        
        let matchesFilter = true;
        if (state.activeFilter !== 'all') {
            if (state.activeFilter === 'Breaking') {
                matchesFilter = update.type === 'Breaking' || update.type === 'Issue';
            } else {
                matchesFilter = update.type === state.activeFilter;
            }
        }
        return matchesSearch && matchesFilter;
    });

    if (filteredUpdates.length === 0) {
        showToast('No updates to export!');
        return;
    }

    const headers = ['Date', 'Type', 'Content', 'Link'];
    
    const escapeCSV = (str) => {
        if (str === null || str === undefined) return '';
        const stringified = String(str);
        const escaped = stringified.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
            return `"${escaped}"`;
        }
        return escaped;
    };

    let csvRows = [];
    csvRows.push(headers.map(escapeCSV).join(","));
    
    filteredUpdates.forEach(update => {
        const row = [
            update.date,
            update.type,
            update.clean_text,
            update.link
        ];
        csvRows.push(row.map(escapeCSV).join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const filterName = state.activeFilter.toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `bigquery_releases_${filterName}_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${filteredUpdates.length} items to CSV!`);
}

// Initial Theme Preferences Setup
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIconMoon.classList.add('hidden');
        themeIconSun.classList.remove('hidden');
    }
}

// Toggle Theme Handler
function toggleTheme() {
    const isLightTheme = document.body.classList.toggle('light-theme');
    if (isLightTheme) {
        localStorage.setItem('theme', 'light');
        themeIconMoon.classList.add('hidden');
        themeIconSun.classList.remove('hidden');
        showToast('Swapped to Light Theme');
    } else {
        localStorage.setItem('theme', 'dark');
        themeIconSun.classList.add('hidden');
        themeIconMoon.classList.remove('hidden');
        showToast('Swapped to Dark Theme');
    }
}
