// ============================================
// PNEUOMA Access Control
// Content gating for Free vs PNEUOMA+
// ============================================

const PneuomaAccess = {
    // Free content - selection of free games + basic tools
    freeContent: {
        games: {
            'ages-4-8': ['cloudkeeper', 'pulse', 'songbird'],
            'ages-8-13': ['aura', 'tidepool', 'echogarden'],
            'ages-13-18': ['deep', 'solfege', 'chill'],
            'ages-18+': ['drift', 'reset', 'anchor']
        },
        
        rituals: ['morning-rise', 'sleep-descent', 'transition-reset'],
        multiplayer: ['partners', 'family-circle', 'classroom-sync']
    },
    
    allContent: {
        games: {
            'ages-4-8': ['cloudkeeper', 'pulse', 'songbird', 'tidepool', 'echogarden', 'rainbow'],
            'ages-8-13': ['aura', 'tidepool', 'echogarden', 'solfege', 'dragon', 'starcatcher', 'rhythm'],
            'ages-13-18': ['deep', 'solfege', 'chill', 'aura', 'echogarden', 'tidepool', 'dragon', 'starcatcher', 'rhythm'],
            'ages-18+': ['drift', 'reset', 'anchor', 'deep', 'echogarden', 'tidepool', 'aura', 'solfege', 'align', 'ember']
        },
        
        rituals: [
            'morning-rise', 'sleep-descent', 'transition-reset',
            'deep-focus', 'before', 'decompress',
            'emergency-reset', 'deep-recovery'
        ],
        
        multiplayer: [
            'partners', 'family-circle', 'classroom-sync',
            'therapy-circle', 'remote-sync', 'group-breathe'
        ]
    },
    
    gamePaths: {
        'cloudkeeper': '/games/cloudkeeper/',
        'pulse': '/games/pulse/',
        'songbird': '/games/songbird/',
        'aura': '/games/aura/',
        'tidepool': '/games/tidepool/',
        'echogarden': '/games/echogarden/',
        'deep': '/games/deep/',
        'solfege': '/games/solfege/',
        'chill': '/games/chill/',
        'drift': '/games/drift/',
        'reset': '/games/reset/',
        'anchor': '/games/anchor/',
        'dragon': '/games/dragon/',
        'starcatcher': '/games/starcatcher/',
        'rhythm': '/games/rhythm/',
        'rainbow': '/games/rainbow/',
        'align': '/games/align/',
        'ember': '/games/ember/'
    },
    
    canAccess(contentType, contentId, ageGroup = null) {
        if (typeof PneuomaEntitlements !== 'undefined') {
            return PneuomaEntitlements.evaluateAccess(contentType, contentId).allowed;
        }

        if (typeof PneuomaAuth === 'undefined') return true;
        
        const user = PneuomaAuth.user;
        
        if (!user) {
            return this.isGuestAccessible(contentType, contentId, ageGroup);
        }
        
        if (PneuomaAuth.isMaster()) return true;
        if (PneuomaAuth.isPremium()) return true;
        
        return this.isFreeContent(contentType, contentId, ageGroup);
    },
    
    isFreeContent(contentType, contentId, ageGroup = null) {
        if (typeof PneuomaEntitlements !== 'undefined') {
            return PneuomaEntitlements.isFreeContent(contentType, contentId);
        }

        const freeList = this.freeContent[contentType];
        
        if (!freeList) return false;
        
        if (contentType === 'games') {
            if (ageGroup) {
                const ageGames = freeList[ageGroup] || [];
                return ageGames.includes(contentId);
            }
            return Object.values(freeList).some(list => list.includes(contentId));
        }
        
        if (Array.isArray(freeList)) {
            return freeList.includes(contentId);
        }
        
        return false;
    },
    
    isGuestAccessible(contentType, contentId, ageGroup = null) {
        return this.isFreeContent(contentType, contentId, ageGroup);
    },
    
    getContentIdFromUrl() {
        const path = window.location.pathname;
        
        for (const [id, gamePath] of Object.entries(this.gamePaths)) {
            if (path.includes(gamePath) || path.includes(`/games/${id}`)) {
                return { type: 'games', id };
            }
        }
        
        if (path.includes('/rituals/')) {
            const match = path.match(/\/rituals\/([^\/]+)/);
            if (match) return { type: 'rituals', id: match[1] };
        }
        
        if (path.includes('/multiplayer/')) {
            const match = path.match(/\/multiplayer\/([^\/]+)/);
            if (match) return { type: 'multiplayer', id: match[1] };
        }
        
        return null;
    },
    
    protectPage(ageGroup = null) {
        const content = this.getContentIdFromUrl();
        if (!content) return true;
        
        if (!this.canAccess(content.type, content.id, ageGroup)) {
            this.showUpgradeModal(content);
            return false;
        }
        
        return true;
    },
    
    showUpgradeModal(content) {
        if (document.getElementById('upgrade-modal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'upgrade-modal';
        modal.innerHTML = `
            <div class="upgrade-modal-overlay">
                <div class="upgrade-modal-content">
                    <div class="upgrade-icon">🔒</div>
                    <h2>PNEUOMA+ Content</h2>
                    <p>This ${content.type.slice(0, -1)} requires PNEUOMA+.</p>
                    
                    <div class="upgrade-benefits">
                        <h3>With PNEUOMA+, you get:</h3>
                        <ul>
                            <li>✓ Unlimited games</li>
                            <li>✓ Full game + regulation library</li>
                            <li>✓ Full Solfège experiences</li>
                            <li>✓ Permanent progress/history</li>
                            <li>✓ New games/features first</li>
                        </ul>
                    </div>
                    
                    <div class="upgrade-pricing">
                        <span class="price">$9.99</span>
                        <span class="period">/month</span>
                    </div>
                    
                    <div class="upgrade-actions">
                        <a href="/auth/subscribe.html" class="btn-upgrade">Upgrade to PNEUOMA+</a>
                        <a href="/platform/" class="btn-back">Browse Free Content</a>
                    </div>
                    
                    <p class="upgrade-note">
                        Already have an account? <a href="/auth/login.html">Sign in</a>
                    </p>
                </div>
            </div>
        `;
        
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
            .upgrade-icon { font-size: 3rem; margin-bottom: 1rem; }
            .upgrade-modal-content h2 {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
                color: #e6edf3;
            }
            .upgrade-modal-content > p { color: #8b949e; margin-bottom: 1.5rem; }
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
            .upgrade-benefits ul { list-style: none; padding: 0; margin: 0; }
            .upgrade-benefits li {
                color: #e6edf3;
                font-size: 0.875rem;
                padding: 0.25rem 0;
            }
            .upgrade-pricing { margin-bottom: 1.5rem; }
            .upgrade-pricing .price {
                font-size: 2.5rem;
                font-weight: 700;
                color: #64ffda;
            }
            .upgrade-pricing .period { color: #8b949e; }
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
            .btn-back {
                color: #8b949e;
                text-decoration: none;
                font-size: 0.875rem;
            }
            .upgrade-note { font-size: 0.75rem; color: #6e7681; }
            .upgrade-note a { color: #06b6d4; text-decoration: none; }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    },
    
    init(ageGroup = null) {
        if (typeof PneuomaAuth !== 'undefined') {
            PneuomaAuth.init();
        }
        
        return this.protectPage(ageGroup);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PneuomaAccess;
}
