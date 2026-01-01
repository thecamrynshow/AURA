/**
 * PNEUOMA — Main JavaScript
 * Ambient effects and interactions
 */

// ============================================
// Particle System
// ============================================
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 50;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.init();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3 - 0.1, // Slight upward drift
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.1,
            hue: 160 + Math.random() * 40 // Teal to cyan range
        };
    }
    
    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            // Gentle pulsing
            p.alpha = 0.1 + Math.sin(Date.now() * 0.001 + p.x * 0.01) * 0.2;
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`;
            this.ctx.fill();
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.size * 4
            );
            gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.alpha * 0.3})`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        });
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// Smooth Scroll
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// Form Handlers
// ============================================
function initFormHandler() {
    // Partner form
    const partnerForm = document.querySelector('.partner-form');
    if (partnerForm) {
        partnerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const button = partnerForm.querySelector('button');
            const originalText = button.innerHTML;
            
            // Success state
            button.innerHTML = '<span>✓ Message Sent!</span>';
            button.style.background = '#64ffda';
            
            // Store locally (placeholder for real implementation)
            const formData = new FormData(partnerForm);
            const data = Object.fromEntries(formData.entries());
            data.timestamp = Date.now();
            
            const inquiries = JSON.parse(localStorage.getItem('pneuoma_inquiries') || '[]');
            inquiries.push(data);
            localStorage.setItem('pneuoma_inquiries', JSON.stringify(inquiries));
            
            // Reset form
            partnerForm.reset();
            
            // Reset button after delay
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
            }, 3000);
        });
    }
}

// ============================================
// Category Tabs
// ============================================
function initCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    const panels = document.querySelectorAll('.category-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const age = tab.dataset.age;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active panel
            panels.forEach(p => {
                p.classList.remove('active');
                if (p.dataset.age === age) {
                    p.classList.add('active');
                }
            });
        });
    });
}

// ============================================
// Scroll Animations
// ============================================
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Add fade-in class to elements
    const animatedElements = document.querySelectorAll(
        '.platform-card, .solution-card, .game-card, .intention-card, .research-card, .metric, .timeline-item, .partner-option'
    );
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });
    
    // Handle visibility
    document.addEventListener('scroll', () => {
        document.querySelectorAll('.visible').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, { passive: true });
}

// ============================================
// Nav Background on Scroll
// ============================================
function initNavScroll() {
    const nav = document.querySelector('.nav');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(7, 8, 13, 0.9)';
            nav.style.backdropFilter = 'blur(10px)';
        } else {
            nav.style.background = 'linear-gradient(to bottom, #07080d 0%, transparent 100%)';
            nav.style.backdropFilter = 'none';
        }
    }, { passive: true });
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particle system
    const canvas = document.getElementById('particles');
    if (canvas) {
        new ParticleSystem(canvas);
    }
    
    // Initialize other features
    initSmoothScroll();
    initFormHandler();
    initCategoryTabs();
    initScrollAnimations();
    initNavScroll();
    
    // Trigger initial scroll check
    window.dispatchEvent(new Event('scroll'));
    
    console.log('PNEUOMA initialized — The Operating System for Human Regulation');
});

// ============================================
// Easter Egg: Konami Code unlocks zen mode
// ============================================
let konamiIndex = 0;
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

document.addEventListener('keydown', (e) => {
    if (e.keyCode === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            document.body.classList.add('zen-mode');
            console.log('🧘 Zen mode activated');
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

