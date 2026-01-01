/**
 * PNEUOMA Games Hub — Filter System
 */

class GamesFilter {
    constructor() {
        this.filters = {
            age: 'all',
            intention: 'all',
            control: 'all'
        };
        
        this.games = document.querySelectorAll('.game-card-full');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.countNumber = document.querySelector('.count-number');
        this.countComing = document.querySelector('.count-coming');
        
        // Toggle elements
        this.filtersSection = document.getElementById('filters-section');
        this.filtersToggle = document.getElementById('filters-toggle');
        this.activeFilters = document.getElementById('active-filters');
        
        this.isExpanded = false;
        
        this.init();
    }
    
    init() {
        // Filter button clicks
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleFilterClick(btn));
        });
        
        // Toggle button click
        if (this.filtersToggle) {
            this.filtersToggle.addEventListener('click', () => this.toggleFilters());
        }
        
        // Collapse on scroll (optional - smooth UX)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (this.isExpanded) {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.collapseFilters();
                }, 150);
            }
        });
        
        // Collapse when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isExpanded && 
                !this.filtersSection.contains(e.target)) {
                this.collapseFilters();
            }
        });
        
        this.updateCounts();
        this.updateActiveFilterDisplay();
    }
    
    toggleFilters() {
        if (this.isExpanded) {
            this.collapseFilters();
        } else {
            this.expandFilters();
        }
    }
    
    expandFilters() {
        this.isExpanded = true;
        this.filtersSection.classList.add('expanded');
    }
    
    collapseFilters() {
        this.isExpanded = false;
        this.filtersSection.classList.remove('expanded');
    }
    
    handleFilterClick(btn) {
        const filterGroup = btn.closest('.filter-buttons');
        const filterType = filterGroup.dataset.filter;
        const filterValue = btn.dataset.value;
        
        // Update active state
        filterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update filter state
        this.filters[filterType] = filterValue;
        
        // Apply filters
        this.applyFilters();
        
        // Update the toggle display
        this.updateActiveFilterDisplay();
        
        // Collapse after a short delay (let user see their selection)
        setTimeout(() => {
            this.collapseFilters();
        }, 200);
    }
    
    updateActiveFilterDisplay() {
        if (!this.activeFilters) return;
        
        const ageFilter = this.activeFilters.querySelector('[data-type="age"]');
        const intentionFilter = this.activeFilters.querySelector('[data-type="intention"]');
        const controlFilter = this.activeFilters.querySelector('[data-type="control"]');
        
        // Get labels from active buttons
        const activeAge = document.querySelector('.filter-buttons[data-filter="age"] .filter-btn.active');
        const activeIntention = document.querySelector('.filter-buttons[data-filter="intention"] .filter-btn.active');
        const activeControl = document.querySelector('.filter-buttons[data-filter="control"] .filter-btn.active');
        
        if (ageFilter && activeAge) {
            ageFilter.textContent = activeAge.dataset.label || activeAge.textContent;
        }
        if (intentionFilter && activeIntention) {
            intentionFilter.textContent = activeIntention.dataset.label || activeIntention.textContent;
        }
        if (controlFilter && activeControl) {
            controlFilter.textContent = activeControl.dataset.label || activeControl.textContent;
        }
    }
    
    applyFilters() {
        this.games.forEach(game => {
            const matches = this.gameMatchesFilters(game);
            
            if (matches) {
                game.classList.remove('hidden');
                game.style.animation = 'fadeIn 0.3s ease forwards';
            } else {
                game.classList.add('hidden');
            }
        });
        
        this.updateCounts();
    }
    
    gameMatchesFilters(game) {
        const ageMatch = this.filters.age === 'all' || 
            game.dataset.age.split(',').includes(this.filters.age);
        
        const intentionMatch = this.filters.intention === 'all' || 
            game.dataset.intention.split(',').includes(this.filters.intention);
        
        const controlMatch = this.filters.control === 'all' || 
            game.dataset.control === this.filters.control;
        
        return ageMatch && intentionMatch && controlMatch;
    }
    
    updateCounts() {
        let available = 0;
        let coming = 0;
        
        this.games.forEach(game => {
            if (!game.classList.contains('hidden')) {
                if (game.classList.contains('available')) {
                    available++;
                } else if (game.classList.contains('coming-soon')) {
                    coming++;
                }
            }
        });
        
        if (this.countNumber) this.countNumber.textContent = available;
        if (this.countComing) this.countComing.textContent = coming;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new GamesFilter();
});

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
