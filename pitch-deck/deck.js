/* PNEUOMA Pitch Deck - Navigation */

class PitchDeck {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.totalSlides = this.slides.length;
        this.currentSlide = 1;
        
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.currentSlideEl = document.getElementById('current-slide');
        this.totalSlidesEl = document.getElementById('total-slides');
        this.progressEl = document.getElementById('progress');
        
        this.init();
    }
    
    init() {
        // Set total slides
        this.totalSlidesEl.textContent = this.totalSlides;
        
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.next();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prev();
            } else if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
            }
        });
        
        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
        
        this.handleSwipe = () => {
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
        };
        
        // Click to advance (on slide area)
        document.querySelector('.presentation').addEventListener('click', (e) => {
            // Don't advance if clicking nav or other controls
            if (e.target.closest('.nav-controls')) return;
            
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            // Click on right half to advance, left half to go back
            if (x > window.innerWidth / 2) {
                this.next();
            } else {
                this.prev();
            }
        });
        
        // Update initial state
        this.updateUI();
    }
    
    goToSlide(slideNum) {
        if (slideNum < 1 || slideNum > this.totalSlides) return;
        
        // Hide current slide
        this.slides[this.currentSlide - 1].classList.remove('active');
        
        // Show new slide
        this.currentSlide = slideNum;
        this.slides[this.currentSlide - 1].classList.add('active');
        
        this.updateUI();
    }
    
    next() {
        if (this.currentSlide < this.totalSlides) {
            this.goToSlide(this.currentSlide + 1);
        }
    }
    
    prev() {
        if (this.currentSlide > 1) {
            this.goToSlide(this.currentSlide - 1);
        }
    }
    
    updateUI() {
        // Update counter
        this.currentSlideEl.textContent = this.currentSlide;
        
        // Update progress bar
        const progress = (this.currentSlide / this.totalSlides) * 100;
        this.progressEl.style.width = `${progress}%`;
        
        // Update button states
        this.prevBtn.style.opacity = this.currentSlide === 1 ? 0.3 : 1;
        this.nextBtn.style.opacity = this.currentSlide === this.totalSlides ? 0.3 : 1;
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.deck = new PitchDeck();
    console.log('PNEUOMA Pitch Deck loaded. Press F for fullscreen, arrow keys to navigate.');
});


