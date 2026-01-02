/**
 * Anchor — Main Game Controller
 * Anxiety Grounding with 5-4-3-2-1 Technique
 */

class AnchorGame {
    constructor() {
        this.state = 'title'; // title, checkin, grounding, breath, checkout, results
        this.anxietyBefore = 5;
        this.anxietyAfter = 5;
        this.grounding = new GroundingController();
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupGrounding();
        
        Visuals.init();
    }
    
    cacheElements() {
        this.elements = {
            // Screens
            titleScreen: Utils.$('titleScreen'),
            checkinScreen: Utils.$('checkinScreen'),
            groundingScreen: Utils.$('groundingScreen'),
            breathScreen: Utils.$('breathScreen'),
            checkoutScreen: Utils.$('checkoutScreen'),
            resultsScreen: Utils.$('resultsScreen'),
            
            // Title
            startBtn: Utils.$('startBtn'),
            
            // Checkin
            anxietySlider: Utils.$('anxietySlider'),
            scaleFill: Utils.$('scaleFill'),
            scaleValue: Utils.$('scaleValue'),
            checkinContinue: Utils.$('checkinContinue'),
            
            // Grounding
            senseNumber: Utils.$('senseNumber'),
            senseName: Utils.$('senseName'),
            senseInstruction: Utils.$('senseInstruction'),
            senseIcon: Utils.$('senseIcon'),
            itemsContainer: Utils.$('itemsContainer'),
            progressDots: Utils.$('progressDots'),
            progressHint: Utils.$('progressHint'),
            phaseCounter: Utils.$('phaseCounter'),
            
            // Checkout
            anxietySliderAfter: Utils.$('anxietySliderAfter'),
            scaleFillAfter: Utils.$('scaleFillAfter'),
            scaleValueAfter: Utils.$('scaleValueAfter'),
            checkoutContinue: Utils.$('checkoutContinue'),
            
            // Results
            resultsTitle: Utils.$('resultsTitle'),
            resultBefore: Utils.$('resultBefore'),
            resultAfter: Utils.$('resultAfter'),
            resultsChange: Utils.$('resultsChange'),
            resultsMessage: Utils.$('resultsMessage'),
            againBtn: Utils.$('againBtn')
        };
    }
    
    bindEvents() {
        // Start button
        this.elements.startBtn.addEventListener('click', () => this.startCheckin());
        
        // Anxiety sliders
        this.elements.anxietySlider.addEventListener('input', (e) => {
            this.updateAnxietyScale(e.target.value, 'before');
        });
        
        this.elements.anxietySliderAfter.addEventListener('input', (e) => {
            this.updateAnxietyScale(e.target.value, 'after');
        });
        
        // Continue buttons
        this.elements.checkinContinue.addEventListener('click', () => this.startGrounding());
        this.elements.checkoutContinue.addEventListener('click', () => this.showResults());
        
        // Again button
        this.elements.againBtn.addEventListener('click', () => this.reset());
    }
    
    setupGrounding() {
        this.grounding.onSenseChange = (sense, index) => {
            this.showSense(sense, index);
        };
        
        this.grounding.onItemAcknowledged = (count, total) => {
            this.updateItemProgress(count, total);
            Audio.playAcknowledge();
            Audio.playBubble();
        };
        
        this.grounding.onSenseComplete = (sense, index) => {
            Audio.playPhaseComplete();
            
            // Update depth
            const depthLevel = index + 1;
            Visuals.setDepthLevel(depthLevel);
            Visuals.updateDepthIndicator(this.grounding.getProgress());
            
            // Show breath break (except for last sense)
            if (index < GroundingSenses.length - 1) {
                this.showBreathBreak();
            }
        };
        
        this.grounding.onComplete = () => {
            this.showCheckout();
        };
    }
    
    async startCheckin() {
        await Audio.init();
        Audio.startAmbient();
        
        this.state = 'checkin';
        this.showScreen('checkin');
    }
    
    updateAnxietyScale(value, type) {
        const val = parseInt(value);
        
        if (type === 'before') {
            this.anxietyBefore = val;
            this.elements.scaleValue.textContent = val;
            this.elements.scaleFill.style.width = `${val * 10}%`;
        } else {
            this.anxietyAfter = val;
            this.elements.scaleValueAfter.textContent = val;
            this.elements.scaleFillAfter.style.width = `${val * 10}%`;
        }
    }
    
    startGrounding() {
        this.state = 'grounding';
        this.showScreen('grounding');
        Visuals.showDepthIndicator();
        
        this.grounding.start();
    }
    
    showSense(sense, index) {
        // Update header
        Utils.setText(this.elements.senseNumber, sense.count);
        Utils.setText(this.elements.senseName, sense.name);
        Utils.setText(this.elements.senseInstruction, sense.instruction);
        Utils.setText(this.elements.senseIcon, sense.icon);
        
        // Update phase counter
        Utils.setText(this.elements.phaseCounter.querySelector('.current'), 
            `${5 - sense.count + 1}/5`);
        
        // Create item circles
        this.createItemCircles(sense.count);
        
        // Create progress dots
        this.createProgressDots(sense.count);
        
        // Make sure grounding screen is visible
        this.showScreen('grounding');
    }
    
    createItemCircles(count) {
        const container = this.elements.itemsContainer;
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const circle = document.createElement('div');
            circle.className = 'item-circle';
            circle.innerHTML = `
                <span class="item-num">${i + 1}</span>
                <span class="checkmark">✓</span>
            `;
            
            circle.addEventListener('click', (e) => {
                if (!Utils.hasClass(circle, 'active')) {
                    Utils.addClass(circle, 'active');
                    this.grounding.acknowledgeItem();
                    
                    // Create bubble burst at tap location
                    const rect = circle.getBoundingClientRect();
                    Visuals.createBubbleBurst(rect.left + rect.width/2, rect.top);
                }
            });
            
            container.appendChild(circle);
        }
    }
    
    createProgressDots(count) {
        const container = this.elements.progressDots;
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('span');
            dot.className = 'progress-dot';
            if (i === 0) Utils.addClass(dot, 'current');
            container.appendChild(dot);
        }
    }
    
    updateItemProgress(completed, total) {
        const dots = Utils.$$('.progress-dot');
        dots.forEach((dot, i) => {
            Utils.removeClass(dot, 'current');
            Utils.removeClass(dot, 'complete');
            
            if (i < completed) {
                Utils.addClass(dot, 'complete');
            } else if (i === completed) {
                Utils.addClass(dot, 'current');
            }
        });
        
        // Update depth indicator
        Visuals.updateDepthIndicator(this.grounding.getProgress());
    }
    
    showBreathBreak() {
        this.state = 'breath';
        this.showScreen('breath');
        
        // Return to grounding after brief pause
        setTimeout(() => {
            if (this.state === 'breath') {
                this.showScreen('grounding');
                this.state = 'grounding';
            }
        }, 4000);
    }
    
    showCheckout() {
        this.state = 'checkout';
        Visuals.setDepthLevel(5); // At surface
        Visuals.updateDepthIndicator(1);
        
        // Set slider to before value initially
        this.elements.anxietySliderAfter.value = this.anxietyBefore;
        this.updateAnxietyScale(this.anxietyBefore, 'after');
        
        this.showScreen('checkout');
    }
    
    showResults() {
        this.state = 'results';
        
        const change = this.anxietyBefore - this.anxietyAfter;
        
        // Update results display
        Utils.setText(this.elements.resultBefore, this.anxietyBefore);
        Utils.setText(this.elements.resultAfter, this.anxietyAfter);
        
        // Update change display
        const changeEl = this.elements.resultsChange;
        const changeValue = changeEl.querySelector('.change-value');
        
        if (change > 0) {
            Utils.setText(changeValue, `-${change}`);
            Utils.setText(this.elements.resultsTitle, "You're more grounded");
        } else if (change < 0) {
            Utils.setText(changeValue, `+${Math.abs(change)}`);
            Utils.setText(this.elements.resultsTitle, "That's okay");
            Utils.setText(this.elements.resultsMessage, 
                "Sometimes anxiety takes more time. The practice itself is valuable. Consider trying again or another calming activity.");
        } else {
            Utils.setText(changeValue, "0");
            Utils.setText(this.elements.resultsTitle, "You held steady");
            Utils.setText(this.elements.resultsMessage, 
                "Staying the same is also progress. You're building awareness of your present moment.");
        }
        
        Audio.playComplete();
        Visuals.hideDepthIndicator();
        
        this.showScreen('results');
    }
    
    reset() {
        this.state = 'title';
        this.anxietyBefore = 5;
        this.anxietyAfter = 5;
        
        // Reset sliders
        this.elements.anxietySlider.value = 5;
        this.elements.anxietySliderAfter.value = 5;
        this.updateAnxietyScale(5, 'before');
        this.updateAnxietyScale(5, 'after');
        
        // Reset visuals
        Visuals.setDepthLevel(0);
        Visuals.updateDepthIndicator(0);
        
        this.showScreen('title');
    }
    
    showScreen(screenName) {
        // Hide all screens
        const screens = ['title', 'checkin', 'grounding', 'breath', 'checkout', 'results'];
        screens.forEach(name => {
            Utils.removeClass(this.elements[`${name}Screen`], 'active');
        });
        
        // Show target screen
        Utils.addClass(this.elements[`${screenName}Screen`], 'active');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new AnchorGame();
});


