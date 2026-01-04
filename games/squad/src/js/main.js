// ============================================
// Squad — Main Game Logic
// ============================================

class SquadGame {
    constructor() {
        this.squadSize = 0;
        this.purpose = null;
        this.totalRounds = 5;
        this.currentRound = 0;
        this.totalBreaths = 0;
        this.startTime = null;
        this.isBreathing = false;
        
        this.colors = ['#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#4ade80', '#facc15'];
        
        this.purposeSettings = {
            hype: { inTime: 3, outTime: 3, rounds: 4, message: "you're ready to crush it together" },
            calm: { inTime: 5, outTime: 6, rounds: 5, message: "the group energy is grounded" },
            focus: { inTime: 4, outTime: 5, rounds: 5, message: "locked in and ready to work" },
            connect: { inTime: 4, outTime: 4, rounds: 4, message: "you're connected to each other" }
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Start button
        Utils.$('#startBtn').addEventListener('click', () => {
            AudioSystem.init();
            AudioSystem.playTap();
            this.showSizeScreen();
        });
        
        // Size selection
        Utils.$$('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectSize(btn);
            });
        });
        
        // Purpose selection
        Utils.$$('.purpose-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectPurpose(btn);
            });
        });
        
        // Complete actions
        Utils.$('#doneBtn').addEventListener('click', () => {
            window.location.href = '../../platform/games/';
        });
        
        Utils.$('#againBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    showSizeScreen() {
        Utils.updateProgress(1);
        Utils.showScreen('sizeScreen');
    }
    
    selectSize(btn) {
        Utils.$$('.size-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.squadSize = parseInt(btn.dataset.size);
        AudioSystem.playSelect();
        
        setTimeout(() => {
            this.showPurposeScreen();
        }, 300);
    }
    
    showPurposeScreen() {
        Utils.updateProgress(2);
        Utils.showScreen('purposeScreen');
    }
    
    selectPurpose(btn) {
        Utils.$$('.purpose-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.purpose = btn.dataset.purpose;
        this.totalRounds = this.purposeSettings[this.purpose].rounds;
        
        AudioSystem.playSelect();
        
        setTimeout(() => {
            this.showSyncScreen();
        }, 400);
    }
    
    showSyncScreen() {
        Utils.updateProgress(3);
        this.startTime = Date.now();
        this.currentRound = 0;
        this.totalBreaths = 0;
        
        // Set up the sync screen based on purpose
        const settings = this.purposeSettings[this.purpose];
        Utils.$('#syncTitle').textContent = this.purpose === 'hype' ? 'getting hyped' : 
                                            this.purpose === 'calm' ? 'calming down' :
                                            this.purpose === 'focus' ? 'locking in' : 'connecting';
        
        // Create squad orbs
        this.createSquadOrbs();
        
        // Update round display
        Utils.$('#syncRound').textContent = `round 1 of ${this.totalRounds}`;
        Utils.$('#syncFill').style.width = '0%';
        
        Utils.showScreen('syncScreen');
        
        // Start breathing after a short delay
        setTimeout(() => {
            this.startGroupBreathing();
        }, 1000);
    }
    
    createSquadOrbs() {
        const container = Utils.$('#squadCircle');
        
        // Remove existing orbs and lines
        container.querySelectorAll('.member-orb, .connection-line').forEach(el => el.remove());
        
        // Calculate positions
        const containerSize = 280;
        const radius = 110;
        const centerX = containerSize / 2;
        const centerY = containerSize / 2;
        const positions = Utils.positionInCircle(this.squadSize, radius, centerX, centerY);
        
        // Create orbs
        positions.forEach((pos, i) => {
            const orb = document.createElement('div');
            orb.className = 'member-orb';
            orb.textContent = i + 1;
            orb.style.left = `${pos.x - 25}px`;
            orb.style.top = `${pos.y - 25}px`;
            orb.style.background = this.colors[i];
            container.appendChild(orb);
        });
        
        // Create connection lines between orbs
        for (let i = 0; i < this.squadSize; i++) {
            for (let j = i + 1; j < this.squadSize; j++) {
                const line = document.createElement('div');
                line.className = 'connection-line';
                
                const x1 = positions[i].x;
                const y1 = positions[i].y;
                const x2 = positions[j].x;
                const y2 = positions[j].y;
                
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                
                line.style.width = `${length}px`;
                line.style.left = `${x1}px`;
                line.style.top = `${y1}px`;
                line.style.transform = `rotate(${angle}deg)`;
                
                container.appendChild(line);
            }
        }
    }
    
    async startGroupBreathing() {
        if (this.isBreathing) return;
        this.isBreathing = true;
        
        const settings = this.purposeSettings[this.purpose];
        const center = Utils.$('#centerBreath');
        const text = Utils.$('#breathText');
        const orbs = Utils.$$('.member-orb');
        const lines = Utils.$$('.connection-line');
        
        for (let round = 0; round < this.totalRounds; round++) {
            this.currentRound = round + 1;
            Utils.$('#syncRound').textContent = `round ${this.currentRound} of ${this.totalRounds}`;
            
            // Inhale
            text.textContent = 'inhale';
            center.classList.add('inhale');
            center.classList.remove('exhale');
            orbs.forEach(orb => {
                orb.classList.add('inhale');
                orb.classList.remove('exhale');
            });
            lines.forEach(line => line.classList.add('active'));
            
            AudioSystem.playGroupBreathIn(this.squadSize);
            await Utils.wait(settings.inTime * 1000);
            
            // Exhale
            text.textContent = 'exhale';
            center.classList.add('exhale');
            center.classList.remove('inhale');
            orbs.forEach(orb => {
                orb.classList.add('exhale');
                orb.classList.remove('inhale');
            });
            lines.forEach(line => line.classList.remove('active'));
            
            AudioSystem.playGroupBreathOut(this.squadSize);
            await Utils.wait(settings.outTime * 1000);
            
            this.totalBreaths += this.squadSize;
            
            // Update progress
            const progress = ((round + 1) / this.totalRounds) * 100;
            Utils.$('#syncFill').style.width = `${progress}%`;
            
            if (round < this.totalRounds - 1) {
                AudioSystem.playRoundComplete();
            }
        }
        
        // Complete
        text.textContent = 'synced';
        center.classList.remove('inhale', 'exhale');
        orbs.forEach(orb => orb.classList.remove('inhale', 'exhale'));
        
        AudioSystem.playSuccess();
        
        setTimeout(() => {
            this.showCompleteScreen();
        }, 1500);
    }
    
    showCompleteScreen() {
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        const settings = this.purposeSettings[this.purpose];
        
        // Populate stats
        Utils.$('#statPeople').textContent = this.squadSize;
        Utils.$('#statBreaths').textContent = this.totalBreaths;
        Utils.$('#statTime').textContent = Utils.formatTime(elapsed);
        
        // Set message
        Utils.$('#completeMessage').textContent = settings.message;
        
        // Create complete squad visual
        this.createCompleteVisual();
        
        Utils.showScreen('completeScreen');
    }
    
    createCompleteVisual() {
        const container = Utils.$('#completeSquad');
        container.innerHTML = '';
        
        const containerSize = 150;
        const radius = 50;
        const centerX = containerSize / 2;
        const centerY = containerSize / 2;
        const positions = Utils.positionInCircle(this.squadSize, radius, centerX, centerY);
        
        // Create orbs
        positions.forEach((pos, i) => {
            const orb = document.createElement('div');
            orb.className = 'complete-orb';
            orb.style.left = `${pos.x - 20}px`;
            orb.style.top = `${pos.y - 20}px`;
            orb.style.background = this.colors[i];
            orb.style.animationDelay = `${i * 0.2}s`;
            container.appendChild(orb);
        });
        
        // Create lines
        for (let i = 0; i < this.squadSize; i++) {
            const next = (i + 1) % this.squadSize;
            const line = document.createElement('div');
            line.className = 'complete-line';
            
            const x1 = positions[i].x;
            const y1 = positions[i].y;
            const x2 = positions[next].x;
            const y2 = positions[next].y;
            
            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
            
            line.style.width = `${length}px`;
            line.style.left = `${x1}px`;
            line.style.top = `${y1}px`;
            line.style.transform = `rotate(${angle}deg)`;
            
            container.appendChild(line);
        }
    }
    
    restart() {
        this.squadSize = 0;
        this.purpose = null;
        this.currentRound = 0;
        this.totalBreaths = 0;
        this.startTime = null;
        this.isBreathing = false;
        
        // Reset UI
        Utils.$$('.size-btn').forEach(b => b.classList.remove('selected'));
        Utils.$$('.purpose-btn').forEach(b => b.classList.remove('selected'));
        
        Utils.updateProgress(0);
        Utils.showScreen('titleScreen');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SquadGame();
});



