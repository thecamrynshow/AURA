// ============================================
// PNEUOMA Page Protection
// Checks access before allowing content to load
// ============================================

(function() {
    // Free content - 3 per category
    const FREE_CONTENT = {
        games: [
            'cloudkeeper', 'pulse', 'songbird',  // Ages 4-8
            'aura', 'tidepool', 'echogarden',    // Ages 8-13
            'deep', 'solfege', 'chill',          // Ages 13-18 (teens)
            'drift', 'reset', 'anchor'           // Ages 18+ (adults)
        ],
        rituals: [
            'morning-rise', 'sleep-descent', 'transition-reset'
        ],
        multiplayer: [
            'partners', 'family-circle', 'classroom-sync'
        ]
    };
    
    // Extract content type and ID from URL
    function getContentFromUrl() {
        const path = window.location.pathname;
        
        // Check games
        const gameMatch = path.match(/\/games\/([^\/]+)/);
        if (gameMatch) {
            return { type: 'games', id: gameMatch[1].toLowerCase() };
        }
        
        // Check rituals
        const ritualMatch = path.match(/\/rituals\/([^\/]+)/);
        if (ritualMatch) {
            return { type: 'rituals', id: ritualMatch[1].toLowerCase() };
        }
        
        // Check multiplayer
        const multiplayerMatch = path.match(/\/multiplayer\/([^\/]+)/);
        if (multiplayerMatch) {
            return { type: 'multiplayer', id: multiplayerMatch[1].toLowerCase() };
        }
        
        return null;
    }
    
    // Check if current content is free
    function isCurrentContentFree() {
        const content = getContentFromUrl();
        if (!content) return true; // Not a protected page
        
        const freeList = FREE_CONTENT[content.type];
        if (!freeList) return true;
        
        return freeList.includes(content.id);
    }
    
    // Check if user has access
    function hasAccess() {
        // Check localStorage for user data
        const storedUser = localStorage.getItem('pneuoma_user');
        if (!storedUser) {
            return isCurrentContentFree();
        }
        
        try {
            const user = JSON.parse(storedUser);
            
            // Master accounts always have access
            const masterEmails = ['camrynjackson@pneuoma.com', 'camryn@pneuoma.com'];
            if (masterEmails.includes(user.email?.toLowerCase())) {
                return true;
            }
            
            // Premium/Family subscribers have access
            if (user.subscription === 'premium' || user.subscription === 'family' || user.subscription === 'master') {
                return true;
            }
            
            // Free users only get free content
            return isCurrentContentFree();
            
        } catch (e) {
            return isCurrentContentFree();
        }
    }
    
    // Show upgrade modal
    function showUpgradeModal() {
        const content = getContentFromUrl();
        const contentType = content?.type || 'content';
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'premium-gate-modal';
        modal.innerHTML = `
            <style>
                #premium-gate-modal {
                    position: fixed;
                    inset: 0;
                    background: rgba(10, 12, 16, 0.98);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    padding: 1rem;
                }
                
                .gate-content {
                    background: linear-gradient(135deg, #161b22, #1c2128);
                    border: 1px solid #30363d;
                    border-radius: 16px;
                    padding: 2.5rem;
                    max-width: 420px;
                    text-align: center;
                    animation: gateSlideIn 0.3s ease;
                }
                
                @keyframes gateSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                
                .gate-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }
                
                .gate-content h2 {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 1.75rem;
                    color: #e6edf3;
                    margin-bottom: 0.75rem;
                }
                
                .gate-content p {
                    color: #8b949e;
                    font-size: 1rem;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                }
                
                .gate-features {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    text-align: left;
                }
                
                .gate-features ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .gate-features li {
                    color: #e6edf3;
                    padding: 0.35rem 0;
                    font-size: 0.9rem;
                }
                
                .gate-features li::before {
                    content: '✓ ';
                    color: #64ffda;
                }
                
                .gate-price {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #64ffda;
                    margin-bottom: 0.25rem;
                }
                
                .gate-price span {
                    font-size: 1rem;
                    color: #8b949e;
                    font-weight: 400;
                }
                
                .gate-trial {
                    color: #8b949e;
                    font-size: 0.85rem;
                    margin-bottom: 1.5rem;
                }
                
                .gate-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .btn-gate-primary {
                    display: block;
                    padding: 1rem;
                    background: linear-gradient(135deg, #06b6d4, #64ffda);
                    color: #0a0c10;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }
                
                .btn-gate-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(6, 182, 212, 0.4);
                }
                
                .btn-gate-secondary {
                    display: block;
                    padding: 0.75rem;
                    color: #8b949e;
                    text-decoration: none;
                    font-size: 0.9rem;
                    transition: color 0.2s;
                }
                
                .btn-gate-secondary:hover {
                    color: #e6edf3;
                }
            </style>
            
            <div class="gate-content">
                <div class="gate-icon">🔒</div>
                <h2>Premium ${contentType === 'games' ? 'Game' : contentType === 'rituals' ? 'Ritual' : 'Mode'}</h2>
                <p>This ${contentType === 'games' ? 'game' : contentType === 'rituals' ? 'ritual' : 'multiplayer mode'} is part of the PNEUOMA Premium collection.</p>
                
                <div class="gate-features">
                    <ul>
                        <li>All 25+ regulation games</li>
                        <li>All 8 daily rituals</li>
                        <li>All 6 multiplayer modes</li>
                        <li>Family profiles (up to 5)</li>
                    </ul>
                </div>
                
                <div class="gate-price">$9.99<span>/month</span></div>
                <p class="gate-trial">7-day free trial • Cancel anytime</p>
                
                <div class="gate-buttons">
                    <a href="/auth/subscribe.html" class="btn-gate-primary">Start Free Trial</a>
                    <a href="/platform/${contentType || 'games'}/" class="btn-gate-secondary">← Browse Free ${contentType === 'games' ? 'Games' : contentType === 'rituals' ? 'Rituals' : 'Modes'}</a>
                </div>
            </div>
        `;
        
        // Prevent scrolling
        document.body.style.overflow = 'hidden';
        document.body.appendChild(modal);
    }
    
    // Check access immediately
    if (!hasAccess()) {
        // Block the page immediately
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showUpgradeModal);
        } else {
            showUpgradeModal();
        }
    }
})();
