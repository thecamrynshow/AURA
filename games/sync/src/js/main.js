/**
 * Sync — Main Game Controller
 * Couples Co-Regulation Experience
 */

class SyncGame {
    constructor() {
        this.state = 'title';
        this.phaseController = new PhaseController();
        
        // Partner states
        this.partners = {
            1: { breathing: false, state: 'idle' },
            2: { breathing: false, state: 'idle' }
        };
        
        // Sync tracking
        this.syncScore = 0;
        this.syncMoments = 0;
        this.totalSyncTime = 0;
        this.lastSyncCheck = 0;
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupPhaseController();
        
        Visuals.init();
    }
    
    cacheElements() {
        this.elements = {
            // Screens
            titleScreen: Utils.$('titleScreen'),
            setupScreen: Utils.$('setupScreen'),
            syncScreen: Utils.$('syncScreen'),
            completeScreen: Utils.$('completeScreen'),
            
            // Title
            startBtn: Utils.$('startBtn'),
            
            // Setup
            setupSteps: Utils.$$('.setup-step'),
            setupContinue: Utils.$('setupContinue'),
            
            // Sync
            phaseTitle: Utils.$('phaseTitle'),
            phaseInstruction: Utils.$('phaseInstruction'),
            orb1: Utils.$('orb1'),
            orb2: Utils.$('orb2'),
            state1: Utils.$('state1'),
            state2: Utils.$('state2'),
            connectionLine: Utils.$('connectionLine'),
            sharedBreath: Utils.$('sharedBreath'),
            sharedText: Utils.$('sharedText'),
            sessionTimer: Utils.$('sessionTimer'),
            
            // Complete
            syncTime: Utils.$('syncTime'),
            syncPercent: Utils.$('syncPercent'),
            againBtn: Utils.$('againBtn')
        };
    }
    
    bindEvents() {
        // Start
        this.elements.startBtn.addEventListener('click', () => this.showSetup());
        
        // Setup continue
        this.elements.setupContinue.addEventListener('click', () => this.startSync());
        
        // Orb interactions
        this.elements.orb1.addEventListener('touchstart', (e) => this.handleOrbTouch(1, 'start', e));
        this.elements.orb1.addEventListener('touchend', (e) => this.handleOrbTouch(1, 'end', e));
        this.elements.orb1.addEventListener('mousedown', (e) => this.handleOrbTouch(1, 'start', e));
        this.elements.orb1.addEventListener('mouseup', (e) => this.handleOrbTouch(1, 'end', e));
        
        this.elements.orb2.addEventListener('touchstart', (e) => this.handleOrbTouch(2, 'start', e));
        this.elements.orb2.addEventListener('touchend', (e) => this.handleOrbTouch(2, 'end', e));
        this.elements.orb2.addEventListener('mousedown', (e) => this.handleOrbTouch(2, 'start', e));
        this.elements.orb2.addEventListener('mouseup', (e) => this.handleOrbTouch(2, 'end', e));
        
        // Again button
        this.elements.againBtn.addEventListener('click', () => this.reset());
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => {
            if (this.state === 'sync') e.preventDefault();
        });
    }
    
    setupPhaseController() {
        this.phaseController.onPhaseChange = (phase, index) => {
            Utils.setText(this.elements.phaseTitle, phase.name);
            Utils.setText(this.elements.phaseInstruction, phase.instruction);
            Audio.playPhaseChange();
        };
        
        this.phaseController.onBreathCue = (type, duration) => {
            this.showSharedBreath(type, duration);
            Audio.playBreathCue(type);
        };
        
        this.phaseController.onTouchPrompt = (text) => {
            Visuals.showTouchPrompt(text);
        };
        
        this.phaseController.onProgress = (progress, elapsed) => {
            Utils.setText(this.elements.sessionTimer.querySelector('.timer-value'), 
                Utils.formatTime(elapsed / 1000));
            
            this.checkSync();
        };
        
        this.phaseController.onComplete = () => {
            this.complete();
        };
    }
    
    showSetup() {
        this.state = 'setup';
        this.showScreen('setup');
        
        // Animate setup steps
        this.elements.setupSteps.forEach((step, i) => {
            setTimeout(() => {
                Utils.addClass(step, 'active');
            }, i * 500);
        });
    }
    
    async startSync() {
        this.state = 'sync';
        
        await Audio.init();
        Audio.startAmbient();
        
        this.showScreen('sync');
        Utils.addClass(this.elements.sessionTimer, 'visible');
        
        this.phaseController.start();
        this.startSyncTracking();
    }
    
    handleOrbTouch(person, action, event) {
        if (this.state !== 'sync') return;
        event.preventDefault();
        
        const orb = this.elements[`orb${person}`];
        const stateEl = this.elements[`state${person}`];
        
        if (action === 'start') {
            // Partner is inhaling (pressing)
            this.partners[person].breathing = true;
            this.partners[person].state = 'inhale';
            
            Utils.addClass(orb, 'inhale');
            Utils.removeClass(orb, 'exhale');
            Utils.addClass(orb, 'active');
            Utils.setText(stateEl, 'Breathing in...');
        } else {
            // Partner is exhaling (releasing)
            this.partners[person].breathing = false;
            this.partners[person].state = 'exhale';
            
            Utils.removeClass(orb, 'inhale');
            Utils.addClass(orb, 'exhale');
            Utils.setText(stateEl, 'Breathing out...');
            
            // Remove exhale class after animation
            setTimeout(() => {
                if (this.partners[person].state === 'exhale') {
                    Utils.removeClass(orb, 'exhale');
                    Utils.removeClass(orb, 'active');
                    this.partners[person].state = 'idle';
                    Utils.setText(stateEl, 'Tap to breathe');
                }
            }, 2000);
        }
        
        this.checkSync();
    }
    
    showSharedBreath(type, duration) {
        const sharedBreath = this.elements.sharedBreath;
        const sharedText = this.elements.sharedText;
        
        Utils.addClass(sharedBreath, 'active');
        
        if (type === 'inhale') {
            Utils.removeClass(sharedBreath, 'exhale');
            Utils.addClass(sharedBreath, 'inhale');
            Utils.setText(sharedText, 'Breathe in together');
        } else if (type === 'hold') {
            Utils.setText(sharedText, 'Hold');
        } else {
            Utils.removeClass(sharedBreath, 'inhale');
            Utils.addClass(sharedBreath, 'exhale');
            Utils.setText(sharedText, 'Release together');
        }
    }
    
    startSyncTracking() {
        this.syncTrackInterval = setInterval(() => {
            if (this.state !== 'sync') return;
            
            // Calculate sync based on matching states
            const areSynced = this.partners[1].state === this.partners[2].state && 
                             this.partners[1].state !== 'idle';
            
            if (areSynced) {
                this.totalSyncTime += 500;
                this.syncMoments++;
            }
        }, 500);
    }
    
    checkSync() {
        const now = Date.now();
        if (now - this.lastSyncCheck < 200) return;
        this.lastSyncCheck = now;
        
        const p1 = this.partners[1];
        const p2 = this.partners[2];
        
        let syncLevel = 0;
        
        // Both in same state (not idle)
        if (p1.state === p2.state && p1.state !== 'idle') {
            syncLevel = 1;
            
            // Show sync effect
            Utils.addClass(Utils.$('gameContainer'), 'synced');
            
            if (!this.wasSynced) {
                Audio.playSync();
                Visuals.createSyncBurst();
                this.wasSynced = true;
            }
        } else if ((p1.state !== 'idle' || p2.state !== 'idle')) {
            // One is active
            syncLevel = 0.3;
            Utils.removeClass(Utils.$('gameContainer'), 'synced');
            this.wasSynced = false;
        } else {
            Utils.removeClass(Utils.$('gameContainer'), 'synced');
            this.wasSynced = false;
        }
        
        Visuals.updateConnectionLine(syncLevel);
    }
    
    complete() {
        this.state = 'complete';
        
        if (this.syncTrackInterval) clearInterval(this.syncTrackInterval);
        
        // Calculate stats
        const totalTime = this.phaseController.totalDuration;
        const syncPercent = Math.round((this.totalSyncTime / totalTime) * 100);
        
        Utils.setText(this.elements.syncTime, Utils.formatTime(totalTime / 1000));
        Utils.setText(this.elements.syncPercent, `${syncPercent}%`);
        
        Audio.playComplete();
        
        this.showScreen('complete');
        Utils.removeClass(this.elements.sessionTimer, 'visible');
    }
    
    reset() {
        this.state = 'title';
        this.partners = {
            1: { breathing: false, state: 'idle' },
            2: { breathing: false, state: 'idle' }
        };
        this.syncScore = 0;
        this.syncMoments = 0;
        this.totalSyncTime = 0;
        this.wasSynced = false;
        
        // Reset orbs
        Utils.removeClass(this.elements.orb1, 'inhale');
        Utils.removeClass(this.elements.orb1, 'exhale');
        Utils.removeClass(this.elements.orb1, 'active');
        Utils.removeClass(this.elements.orb2, 'inhale');
        Utils.removeClass(this.elements.orb2, 'exhale');
        Utils.removeClass(this.elements.orb2, 'active');
        Utils.removeClass(Utils.$('gameContainer'), 'synced');
        
        Utils.setText(this.elements.state1, 'Tap to breathe');
        Utils.setText(this.elements.state2, 'Tap to breathe');
        
        Audio.stopAll();
        
        this.showScreen('title');
    }
    
    showScreen(screenName) {
        ['title', 'setup', 'sync', 'complete'].forEach(name => {
            Utils.removeClass(this.elements[`${name}Screen`], 'active');
        });
        
        Utils.addClass(this.elements[`${screenName}Screen`], 'active');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SyncGame();
});



