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
    
    // Check if user is master account
    isMaster() {
        return this.user && this.masterEmails.includes(this.user.email.toLowerCase());
    },
    
    // Check if user has premium access
    isPremium() {
        if (!this.user) return false;
        if (this.isMaster()) return true;
        return this.user.subscription === 'premium' || this.user.subscription === 'school';
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
            
            // Redirect to platform
            window.location.href = '/platform/';
            
        } catch (error) {
            errorEl.textContent = error.message;
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
    }
};

// Initialize on load
PneuomaAuth.init();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PneuomaAuth;
}

