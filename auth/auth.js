// ============================================
// PNEUOMA Authentication System
// ============================================

const PneuomaAuth = {
    // Server URL
    serverUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : 'https://pneuoma.onrender.com',
    
    // Master accounts with full access
    masterEmails: [
        'camrynjackson@pneuoma.com',
        'camryn@pneuoma.com'
    ],
    
    // Current user
    user: null,
    
    // Initialize auth state
    init() {
        const storedUser = localStorage.getItem('pneuoma_user');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
            } catch (e) {
                localStorage.removeItem('pneuoma_user');
            }
        }
        return this.user;
    },
    
    // Check if user is logged in
    isLoggedIn() {
        return !!this.user;
    },
    
    // Check if user is master account.
    // Master is a SERVER-ASSIGNED role (role: 'master'). This is a cached,
    // cosmetic check only — the server re-verifies on every protected API call.
    isMaster() {
        return !!(this.user && (this.user.role === 'master' || this.user.subscription === 'master'));
    },
    
    // Check if user has premium access (cached for UX; server is source of truth).
    isPremium() {
        if (!this.user) return false;
        if (this.isMaster()) return true;
        if (this.user.isPremium === true) return true;
        return this.user.subscription === 'premium' || 
               this.user.subscription === 'family' || 
               this.user.subscription === 'school';
    },
    
    // Get subscription tier
    getTier() {
        if (!this.user) return 'guest';
        if (this.isMaster()) return 'master';
        return this.user.subscription || 'free';
    },
    
    // Login with email/password
    async login(email, password) {
        const errorEl = document.getElementById('error-message');
        const btn = document.getElementById('login-btn');
        const loader = btn.querySelector('.btn-loader');
        const btnText = btn.querySelector('span');
        
        // Show loading
        loader.classList.remove('hidden');
        btnText.textContent = 'Signing in...';
        btn.disabled = true;
        errorEl.classList.add('hidden');
        
        // NOTE: Master/admin access is granted by the SERVER (role: 'master')
        // after a normal authenticated login. There is intentionally no
        // client-side master password — putting one in frontend JS would let
        // anyone read it and gain full access.
        
        try {
            const response = await fetch(`${this.serverUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Invalid email or password');
            }
            
            // Store user data
            this.user = data.user;
            localStorage.setItem('pneuoma_user', JSON.stringify(this.user));
            localStorage.setItem('pneuoma_token', data.token);
            
            // Redirect after login (honor ?redirect= for checkout return paths)
            const redirect = window.PNEUOMA_POST_LOGIN_REDIRECT;
            delete window.PNEUOMA_POST_LOGIN_REDIRECT;
            window.location.href = (redirect && redirect.startsWith('/') && !redirect.startsWith('//'))
                ? redirect
                : '/platform/';
            
        } catch (error) {
            // Check if it's a network error (server offline)
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorEl.textContent = 'Could not reach the server. Please check your connection and try again.';
            } else {
                errorEl.textContent = error.message;
            }
            errorEl.classList.remove('hidden');
            
            // Reset button
            loader.classList.add('hidden');
            btnText.textContent = 'Sign In';
            btn.disabled = false;
        }
    },
    
    // Sign up with email
    async signup(formData) {
        const errorEl = document.getElementById('error-message');
        const btn = document.getElementById('signup-btn');
        const loader = btn.querySelector('.btn-loader');
        const btnText = btn.querySelector('span');
        
        // Show loading
        loader.classList.remove('hidden');
        btnText.textContent = 'Creating account...';
        btn.disabled = true;
        errorEl.classList.add('hidden');
        
        try {
            const response = await fetch(`${this.serverUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Could not create account');
            }
            
            // Store user data
            this.user = data.user;
            localStorage.setItem('pneuoma_user', JSON.stringify(this.user));
            localStorage.setItem('pneuoma_token', data.token);
            
            // Redirect to platform
            window.location.href = '/platform/';
            
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
            
            // Reset button
            loader.classList.add('hidden');
            btnText.textContent = 'Create Account';
            btn.disabled = false;
        }
    },
    
    // Google OAuth
    loginWithGoogle() {
        // Will be implemented with actual OAuth
        window.location.href = `${this.serverUrl}/api/auth/google`;
    },
    
    // Logout
    logout() {
        this.user = null;
        localStorage.removeItem('pneuoma_user');
        localStorage.removeItem('pneuoma_token');
        window.location.href = '/';
    },
    
    // Forgot password
    async forgotPassword(email) {
        try {
            const response = await fetch(`${this.serverUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error('Could not send reset email');
        }
    },
    
    // Get auth headers for API calls
    getHeaders() {
        const token = localStorage.getItem('pneuoma_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },
    
    // Confirm entitlement with the server (authoritative). Updates the cached
    // user with the server's answer. Returns the entitlement object, or null on
    // network error (callers should treat null as "use cached / fail open for
    // UX, but never grant new access on null").
    async confirmAccess() {
        if (!this.user) return { isPremium: false, status: 'guest', plan: 'guest' };
        try {
            const response = await fetch(`${this.serverUrl}/api/me/subscription`, {
                headers: this.getHeaders()
            });
            if (!response.ok) return null;
            const data = await response.json();
            this.user.isPremium = !!data.isPremium;
            this.user.status = data.status;
            this.user.subscription = data.isPremium ? data.plan : (this.user.role === 'master' ? 'master' : 'free');
            localStorage.setItem('pneuoma_user', JSON.stringify(this.user));
            return data;
        } catch (error) {
            console.warn('[auth] Could not confirm access with server:', error.message);
            return null;
        }
    },
    
    // Backwards-compatible alias.
    async refreshSubscription() {
        const data = await this.confirmAccess();
        return !!(data && data.isPremium);
    }
};

// Initialize on load
PneuomaAuth.init();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PneuomaAuth;
}

