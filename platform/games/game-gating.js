// ============================================
// PNEUOMA Game Gating
// Shows locked/unlocked status based on subscription
// ============================================

(function() {
    // Free games by category (first 3 per age group)
    const FREE_GAMES = {
        // Ages 4-8 (young kids)
        'cloudkeeper': true,
        'pulse': true,
        'songbird': true,
        
        // Ages 8-13 (kids)  
        'aura': true,
        'tidepool': true,
        'echogarden': true,
        
        // Ages 13-18 (teens)
        'deep': true,
        'solfege': true,
        'chill': true,
        
        // Ages 18+ (adults)
        'drift': true,
        'reset': true,
        'anchor': true
    };
    
    // Game name to ID mapping (from card titles)
    const GAME_NAME_TO_ID = {
        'project aura': 'aura',
        'echo garden': 'echogarden',
        'tidepool': 'tidepool',
        'pulse': 'pulse',
        'the deep': 'deep',
        'cloud keeper': 'cloudkeeper',
        'songbird': 'songbird',
        'solfège': 'solfege',
        'solfege': 'solfege',
        'zone': 'zone',
        'threshold': 'threshold',
        'before': 'before',
        'drift': 'drift',
        'reset': 'reset',
        'anchor': 'anchor',
        'sync': 'sync',
        'forge': 'forge',
        'decompress': 'decompress',
        'rise': 'rise',
        'chill': 'chill',
        'focus': 'focus',
        'bounce': 'bounce',
        'pause': 'pause',
        'vibe check': 'vibecheck',
        'squad sync': 'squad',
        'dragon\'s breath': 'dragon',
        'star catcher': 'starcatcher',
        'rhythm islands': 'rhythm',
        'rainbow painter': 'rainbow',
        'rainbow': 'rainbow',
        'ember': 'ember',
        'align': 'align'
    };
    
    function remainingSessions() {
        if (window.PneuomaGate && typeof window.PneuomaGate.remainingSessions === 'function') {
            return window.PneuomaGate.remainingSessions();
        }
        if (typeof PneuomaEntitlements !== 'undefined') {
            return PneuomaEntitlements.remainingSessions();
        }
        try {
            const raw = localStorage.getItem('pneuoma_game_sessions');
            const data = raw ? JSON.parse(raw) : null;
            const today = new Date().toISOString().slice(0, 10);
            if (!data || data.date !== today) return 3;
            return Math.max(0, 3 - (data.count || 0));
        } catch (e) {
            return 3;
        }
    }

    async function initGameGating() {
        // Initialize auth
        if (typeof PneuomaAuth !== 'undefined') {
            PneuomaAuth.init();
            // Confirm entitlement with the server so the catalog reflects the
            // authoritative subscription status (not just cached localStorage).
            if (PneuomaAuth.isLoggedIn() && typeof PneuomaAuth.confirmAccess === 'function') {
                try { await PneuomaAuth.confirmAccess(); } catch (e) { /* offline: use cached */ }
            }
        }
        
        // Check if user has PNEUOMA+ access
        const hasPlus = typeof PneuomaAuth !== 'undefined' && 
            (PneuomaAuth.isPremium() || PneuomaAuth.isMaster());
        
        // Get all game cards
        const gameCards = document.querySelectorAll('.game-card-full');
        
        gameCards.forEach(card => {
            // Get game name from title
            const titleEl = card.querySelector('.game-name');
            if (!titleEl) return;
            
            const gameName = titleEl.textContent.trim().toLowerCase();
            const gameId = GAME_NAME_TO_ID[gameName];
            
            // Check if this is a free game
            const isFreeGame = FREE_GAMES[gameId] === true;
            
            // If user has PNEUOMA+ OR it's a free game, keep it unlocked
            if (hasPlus || isFreeGame) {
                // Already unlocked, do nothing
                return;
            }
            
            // Lock the game
            lockGameCard(card, gameId);
        });
        
        // Add unlock banner if user is not logged in or is free tier
        if (!hasPlus) {
            addUpgradeBanner();
        }
    }
    
    function lockGameCard(card, gameId) {
        // Add locked class
        card.classList.add('locked');
        card.classList.remove('available');
        
        // Update status badge
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = 'PNEUOMA+';
            statusBadge.classList.remove('live');
            statusBadge.classList.add('premium-badge');
        }
        
        // Replace play button with upgrade button
        const playBtn = card.querySelector('.btn-primary');
        if (playBtn) {
            const upgradeBtn = document.createElement('a');
            upgradeBtn.href = '/auth/subscribe.html';
            upgradeBtn.className = 'btn btn-locked';
            upgradeBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Unlock with PNEUOMA+</span>
            `;
            playBtn.parentNode.replaceChild(upgradeBtn, playBtn);
        }
        
        // Add lock overlay
        const visualEl = card.querySelector('.game-visual-full');
        if (visualEl && !visualEl.querySelector('.lock-overlay')) {
            const lockOverlay = document.createElement('div');
            lockOverlay.className = 'lock-overlay';
            lockOverlay.innerHTML = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
            `;
            visualEl.appendChild(lockOverlay);
        }
    }
    
    function addUpgradeBanner() {
        const gamesSection = document.querySelector('.games-grid-section');
        if (!gamesSection) return;
        
        // Check if banner already exists
        if (document.querySelector('.upgrade-banner')) return;
        
        const isLoggedIn = typeof PneuomaAuth !== 'undefined' && PneuomaAuth.isLoggedIn();
        const left = remainingSessions();
        const sessionsLine = `${left} of 3 free game sessions left today.`;
        
        const banner = document.createElement('div');
        banner.className = 'upgrade-banner';
        banner.innerHTML = `
            <div class="upgrade-banner-content">
                <div class="upgrade-banner-icon">🔓</div>
                <div class="upgrade-banner-text">
                    <h3>${isLoggedIn ? 'Upgrade to PNEUOMA+' : 'PNEUOMA Free vs PNEUOMA+'}</h3>
                    <p>${isLoggedIn 
                        ? `Free includes a selection of games and 3 sessions/day. ${sessionsLine} Unlock unlimited play and the full library.` 
                        : 'Free: 3 sessions/day + a selection of games. PNEUOMA+: unlimited games, full library, permanent progress.'}</p>
                </div>
                <a href="${isLoggedIn ? '/auth/subscribe.html' : '/auth/signup.html'}" class="upgrade-banner-btn">
                    ${isLoggedIn ? 'Get PNEUOMA+' : 'Get Started Free'}
                </a>
            </div>
        `;
        
        // Insert after filters
        const filtersEl = document.querySelector('.games-filters');
        if (filtersEl) {
            filtersEl.parentNode.insertBefore(banner, filtersEl.nextSibling);
        } else {
            gamesSection.insertBefore(banner, gamesSection.firstChild);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGameGating);
    } else {
        initGameGating();
    }
})();

