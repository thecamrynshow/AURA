// ============================================
// PNEUOMA Access Control
// Content gating for free vs premium tiers
// ============================================

const PneuomaAccess = {
    // Free content - first 3 in each category
    freeContent: {
        // Games by age group (first 3 each)
        games: {
            'ages-4-8': ['cloudkeeper', 'pulse', 'songbird'],
            'ages-8-13': ['aura', 'tidepool', 'echogarden'],
            'ages-13-18': ['deep', 'solfege', 'aura'],
            'ages-18+': ['deep', 'echogarden', 'tidepool']
        },
        
        // First 3 rituals (matching folder names)
        rituals: ['morning-rise', 'sleep-descent', 'transition-reset'],
        
        // First 3 multiplayer modes (matching folder names)
        multiplayer: ['partners', 'family-circle', 'classroom-sync']
    },
    
    // All content lists (for premium)
    allContent: {
        games: {
            'ages-4-8': ['cloudkeeper', 'pulse', 'songbird', 'tidepool', 'echogarden'],
            'ages-8-13': ['aura', 'tidepool', 'echogarden', 'solfege', 'dragon', 'starcatcher', 'rhythm'],
            'ages-13-18': ['deep', 'solfege', 'aura', 'echogarden', 'tidepool', 'dragon', 'starcatcher', 'rhythm'],
            'ages-18+': ['deep', 'echogarden', 'tidepool', 'aura', 'solfege', 'pulse']
        },
        
        rituals: [
            'morning-calm', 'sleep-prep', 'quick-reset',
            'focus-boost', 'anxiety-relief', 'energy-shift',
            'evening-wind', 'crisis-calm'
        ],
        
        multiplayer: [
            'partners', 'family-circle', 'classroom-sync',
            'therapy-circle', 'remote-sync', 'group-breathe'
        ]
    },
    
    // Game ID to path mapping
    gamePaths: {
        'cloudkeeper': '/games/cloudkeeper/',
        'pulse': '/games/pulse/',
        'songbird': '/games/songbird/',
        'aura': '/games/aura/',
        'tidepool': '/games/tidepool/',
        'echogarden': '/games/echogarden/',
        'deep': '/games/deep/',
        'solfege': '/games/solfege/',
        'dragon': '/games/dragon/',
        'starcatcher': '/games/starcatcher/',
        'rhythm': '/games/rhythm/'
    },
    
    // Check if user can access specific content
    canAccess(contentType, contentId, ageGroup = null) {
        // Always allow if not initialized
        if (typeof PneuomaAuth === 'undefined') return true;
        
        const user = PneuomaAuth.user;
        
        // Not logged in = guest, show upgrade prompt
        if (!user) {
            return this.isGuestAccessible(contentType, contentId, ageGroup);
        }
        
        // Master accounts have full access
        if (PneuomaAuth.isMaster()) return true;
        
        // Premium users have full access
        if (PneuomaAuth.isPremium()) return true;
        
        // Free tier - check against free content
        return this.isFreeContent(contentType, contentId, ageGroup);
    },
    
    // Check if content is in free tier
    isFreeContent(contentType, contentId, ageGroup = null) {
        const freeList = this.freeContent[contentType];
        
        if (!freeList) return false;
        
        // For games, check by age group
        if (contentType === 'games' && ageGroup) {
            const ageGames = freeList[ageGroup] || [];
            return ageGames.includes(contentId);
        }
        
        // For rituals and multiplayer
        if (Array.isArray(freeList)) {
            return freeList.includes(contentId);
        }
        
        return false;
    },
    
    // Guest access (not logged in) - same as free but prompts signup
    isGuestAccessible(contentType, contentId, ageGroup = null) {
        return this.isFreeContent(contentType, contentId, ageGroup);
    },
    
    // Get content ID from current URL
    getContentIdFromUrl() {
        const path = window.location.pathname;
        
        // Check games
        for (const [id, gamePath] of Object.entries(this.gamePaths)) {
            if (path.includes(gamePath) || path.includes(`/games/${id}`)) {
                return { type: 'games', id };
            }
        }
        
        // Check rituals
        if (path.includes('/rituals/')) {
            const match = path.match(/\/rituals\/([^\/]+)/);
            if (match) return { type: 'rituals', id: match[1] };
        }
        
        // Check multiplayer
        if (path.includes('/multiplayer/')) {
            const match = path.match(/\/multiplayer\/([^\/]+)/);
            if (match) return { type: 'multiplayer', id: match[1] };
        }
        
        return null;
    },
    
    // Protect current page
    protectPage(ageGroup = null) {
        const content = this.getContentIdFromUrl();
        if (!content) return true; // Not a protected page
        
        if (!this.canAccess(content.type, content.id, ageGroup)) {
            this.showUpgradeModal(content);
            return false;
        }
        
        return true;
    },
    
    // Show upgrade modal for locked content
    showUpgradeModal(content) {
        // Check if modal already exists
        if (document.getElementById('upgrade-modal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'upgrade-modal';
        modal.innerHTML = `
            <div class="upgrade-modal-overlay">
                <div class="upgrade-modal-content">
                    <div class="upgrade-icon">🔒</div>
                    <h2>Premium Content</h2>
                    <p>This ${content.type.slice(0, -1)} requires a premium subscription.</p>
                    
                    <div class="upgrade-benefits">
                        <h3>With Premium, you get:</h3>
                        <ul>
                            <li>✓ All 25+ regulation games</li>
                            <li>✓ All 8 daily rituals</li>
                            <li>✓ All 6 multiplayer modes</li>
                            <li>✓ Family profiles (up to 5)</li>
                            <li>✓ Progress tracking & insights</li>
                        </ul>
                    </div>
                    
                    <div class="upgrade-pricing">
                        <span class="price">$9.99</span>
                        <span class="period">/month</span>
                    </div>
                    
                    <div class="upgrade-actions">
                        <a href="/auth/signup.html" class="btn-upgrade">Start Free Trial</a>
                        <a href="/platform/" class="btn-back">Browse Free Content</a>
                    </div>
                    
                    <p class="upgrade-note">
                        Already have an account? <a href="/auth/login.html">Sign in</a>
                    </p>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .upgrade-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 1rem;
            }
            
            .upgrade-modal-content {
                background: #161b22;
                border: 1px solid #30363d;
                border-radius: 16px;
                padding: 2rem;
                max-width: 400px;
                text-align: center;
            }
            
            .upgrade-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            
            .upgrade-modal-content h2 {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
                color: #e6edf3;
            }
            
            .upgrade-modal-content > p {
                color: #8b949e;
                margin-bottom: 1.5rem;
            }
            
            .upgrade-benefits {
                background: #0d1117;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1.5rem;
                text-align: left;
            }
            
            .upgrade-benefits h3 {
                font-size: 0.875rem;
                color: #8b949e;
                margin-bottom: 0.75rem;
            }
            
            .upgrade-benefits ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .upgrade-benefits li {
                color: #e6edf3;
                font-size: 0.875rem;
                padding: 0.25rem 0;
            }
            
            .upgrade-pricing {
                margin-bottom: 1.5rem;
            }
            
            .upgrade-pricing .price {
                font-size: 2.5rem;
                font-weight: 700;
                color: #64ffda;
            }
            
            .upgrade-pricing .period {
                color: #8b949e;
            }
            
            .upgrade-actions {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            
            .btn-upgrade {
                display: block;
                padding: 0.875rem 1.5rem;
                background: linear-gradient(135deg, #06b6d4, #64ffda);
                color: #0a0c10;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
            }
            
            .btn-upgrade:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
            }
            
            .btn-back {
                color: #8b949e;
                text-decoration: none;
                font-size: 0.875rem;
            }
            
            .btn-back:hover {
                color: #e6edf3;
            }
            
            .upgrade-note {
                font-size: 0.75rem;
                color: #6e7681;
            }
            
            .upgrade-note a {
                color: #06b6d4;
                text-decoration: none;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    },
    
    // Initialize access control on page load
    init(ageGroup = null) {
        // Wait for auth to initialize
        if (typeof PneuomaAuth !== 'undefined') {
            PneuomaAuth.init();
        }
        
        // Protect current page if needed
        return this.protectPage(ageGroup);
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PneuomaAccess;
}

