// ============================================
// PNEUOMA Page Protection
// Include this script on any page that requires auth
// ============================================

(function() {
    // Wait for DOM and auth to load
    document.addEventListener('DOMContentLoaded', () => {
        // Check if access control is available
        if (typeof PneuomaAccess === 'undefined' || typeof PneuomaAuth === 'undefined') {
            console.warn('PNEUOMA: Auth scripts not loaded');
            return;
        }
        
        // Initialize auth
        PneuomaAuth.init();
        
        // Get page metadata
        const ageGroup = document.body.dataset.ageGroup || null;
        
        // Check access
        if (!PneuomaAccess.init(ageGroup)) {
            // Access denied - modal will be shown by access-control.js
            console.log('PNEUOMA: Premium content - access modal shown');
        }
    });
})();

