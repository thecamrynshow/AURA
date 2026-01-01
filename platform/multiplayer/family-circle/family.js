// ============================================
// Family Circle — Whole Family Regulation
// Up to 6 members • Family streaks
// ============================================

class FamilyCircle {
    constructor() {
        this.members = [];
        this.activity = null;
        this.sessionActive = false;
        this.connection = 0;
        this.peakConnection = 0;
        this.startTime = null;
        this.audioContext = null;
        this.streak = parseInt(localStorage.getItem('familyStreak') || '0');
        
        this.activities = {
            morning: {
                name: 'Morning Start',
                duration: 300,
                inhale: 4,
                exhale: 4,
                guidance: [
                    "Good morning, family!",
                    "Let's start the day together...",
                    "Take a deep breath in...",
                    "And let it all out...",
                    "Today is going to be great!",
                    "We're in this together..."
                ]
            },
            dinner: {
                name: 'Dinner Reset',
                duration: 180,
                inhale: 3,
                exhale: 5,
                guidance: [
                    "Pause from the day...",
                    "We're all here now...",
                    "Let go of everything else...",
                    "Just family time...",
                    "Breathe together...",
                    "Ready to connect..."
                ]
            },
            bedtime: {
                name: 'Bedtime Wind-Down',
                duration: 300,
                inhale: 4,
                exhale: 7,
                guidance: [
                    "The day is done...",
                    "Time to rest together...",
                    "Slow, sleepy breaths...",
                    "Safe and cozy...",
                    "Grateful for each other...",
                    "Peaceful dreams await..."
                ]
            },
            weekend: {
                name: 'Weekend Reset',
                duration: 600,
                inhale: 5,
                exhale: 5,
                guidance: [
                    "No rush today...",
                    "Just family time...",
                    "Let's really be together...",
                    "Feel the connection...",
                    "This is what matters...",
                    "Love fills this space..."
                ]
            },
            tough: {
                name: 'After a Tough Moment',
                duration: 300,
                inhale: 4,
                exhale: 6,
                guidance: [
                    "That was hard...",
                    "But we're still family...",
                    "Let's come back together...",
                    "It's okay to feel...",
                    "We love each other...",
                    "We can repair this..."
                ]
            }
        };
        
        this.init();
    }
    
    $(s) { return document.querySelector(s); }
    $$(s) { return document.querySelectorAll(s); }
    
    init() {
        this.bindEvents();
        this.generateCode();
    }
    
    generateCode() {
        const code = 'FAM-' + Math.floor(1000 + Math.random() * 9000);
        this.$('#sessionCode').textContent = code;
    }
    
    bindEvents() {
        // Welcome
        this.$('#createBtn').addEventListener('click', () => this.showScreen('setupScreen'));
        this.$('#joinBtn').addEventListener('click', () => this.joinSession());
        
        // Setup
        this.$('#backToWelcome').addEventListener('click', () => this.showScreen('welcomeScreen'));
        this.$$('.member-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleMember(e.currentTarget));
        });
        this.$('#nextBtn').addEventListener('click', () => {
            if (this.members.length > 0) {
                this.showScreen('activityScreen');
            }
        });
        
        // Activity
        this.$('#backToSetup').addEventListener('click', () => this.showScreen('setupScreen'));
        this.$$('.activity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const activity = e.currentTarget.dataset.activity;
                this.selectActivity(activity);
            });
        });
        
        // Waiting
        this.$('#startBtn').addEventListener('click', () => this.startSession());
        this.$('#cancelBtn').addEventListener('click', () => {
            this.members = [];
            this.updateMemberCount();
            this.showScreen('welcomeScreen');
        });
        
        // Session
        this.$('#endBtn').addEventListener('click', () => this.endSession());
        
        // Complete
        this.$('#doneBtn').addEventListener('click', () => {
            this.members = [];
            this.$$('.member-btn').forEach(b => b.classList.remove('active'));
            this.updateMemberCount();
            this.showScreen('welcomeScreen');
            this.generateCode();
        });
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {}
    }
    
    playTone(freq, duration) {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 0.2);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    showScreen(screenId) {
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$(`#${screenId}`).classList.add('active');
    }
    
    toggleMember(btn) {
        const emoji = btn.dataset.emoji;
        const role = btn.dataset.role;
        const label = btn.querySelector('.member-label').textContent;
        
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            this.members = this.members.filter(m => m.emoji !== emoji);
        } else if (this.members.length < 6) {
            btn.classList.add('active');
            this.members.push({ emoji, role, label });
        }
        
        this.updateMemberCount();
    }
    
    updateMemberCount() {
        this.$('#memberCount').textContent = this.members.length;
    }
    
    selectActivity(activityKey) {
        this.activity = this.activities[activityKey];
        this.renderFamilyPreview();
        this.showScreen('waitingScreen');
        
        // Simulate others joining
        setTimeout(() => {
            // Ready to start
        }, 1000);
    }
    
    renderFamilyPreview() {
        const container = this.$('#familyPreview');
        container.innerHTML = '';
        
        this.members.forEach((member, i) => {
            const div = document.createElement('div');
            div.className = 'preview-member';
            div.style.animationDelay = (i * 0.2) + 's';
            div.innerHTML = `
                <span class="emoji">${member.emoji}</span>
                <span class="label">${member.label}</span>
            `;
            container.appendChild(div);
        });
    }
    
    joinSession() {
        const code = this.$('#joinCode').value.trim().toUpperCase();
        if (code.length < 4) return;
        
        this.$('#joinedCode').textContent = code;
        this.showScreen('memberWaitingScreen');
        
        // Simulate session starting
        setTimeout(() => {
            if (this.$('#memberWaitingScreen').classList.contains('active')) {
                // Default family for demo
                this.members = [
                    { emoji: '👨', role: 'parent', label: 'Dad' },
                    { emoji: '👩', role: 'parent', label: 'Mom' },
                    { emoji: '👦', role: 'child', label: 'Son' }
                ];
                this.activity = this.activities.morning;
                this.startSession();
            }
        }, 2000);
    }
    
    startSession() {
        this.sessionActive = true;
        this.connection = 0;
        this.peakConnection = 0;
        this.startTime = Date.now();
        
        this.initAudio();
        this.showScreen('sessionScreen');
        
        this.$('#currentActivity').textContent = this.activity.name;
        this.renderCircle();
        this.runSession();
    }
    
    renderCircle() {
        const circle = this.$('#familyCircle');
        
        // Remove old members
        circle.querySelectorAll('.circle-member').forEach(m => m.remove());
        
        const radius = 100;
        const centerX = 140;
        const centerY = 140;
        
        this.members.forEach((member, i) => {
            const angle = (i / this.members.length) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle) - 25;
            const y = centerY + radius * Math.sin(angle) - 25;
            
            const div = document.createElement('div');
            div.className = 'circle-member';
            div.dataset.index = i;
            div.style.left = x + 'px';
            div.style.top = y + 'px';
            div.innerHTML = `
                <span class="emoji">${member.emoji}</span>
                <span class="name">${member.label}</span>
            `;
            circle.appendChild(div);
        });
    }
    
    async runSession() {
        const guidance = this.$('#guidanceText');
        const breathCue = this.$('#breathCue');
        const timer = this.$('#sessionTimer');
        const heart = this.$('#centerHeart');
        const connectionFill = this.$('#connectionFill');
        const connectionValue = this.$('#connectionValue');
        const members = this.$$('.circle-member');
        
        let guidanceIndex = 0;
        let elapsed = 0;
        const duration = this.activity.duration;
        
        // Guidance rotation
        const showGuidance = () => {
            if (!this.sessionActive) return;
            guidance.style.opacity = '0';
            setTimeout(() => {
                guidance.textContent = this.activity.guidance[guidanceIndex % this.activity.guidance.length];
                guidance.style.opacity = '1';
                guidanceIndex++;
            }, 300);
        };
        
        showGuidance();
        const guidanceInterval = setInterval(showGuidance, 8000);
        
        // Timer
        const timerInterval = setInterval(() => {
            elapsed++;
            const remaining = duration - elapsed;
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            if (remaining <= 0) {
                clearInterval(timerInterval);
                clearInterval(guidanceInterval);
                this.completeSession();
            }
        }, 1000);
        
        // Breathing cycle
        const breathCycle = async () => {
            if (!this.sessionActive) return;
            
            const inhale = this.activity.inhale * 1000;
            const exhale = this.activity.exhale * 1000;
            
            // Inhale
            breathCue.textContent = 'Breathe In...';
            members.forEach(m => {
                m.classList.remove('exhale');
                m.classList.add('inhale');
            });
            this.playTone(220, inhale / 1000);
            
            await this.wait(inhale);
            if (!this.sessionActive) return;
            
            // Exhale
            breathCue.textContent = 'Breathe Out...';
            members.forEach(m => {
                m.classList.remove('inhale');
                m.classList.add('exhale');
            });
            this.playTone(165, exhale / 1000);
            
            // Increase connection
            this.connection = Math.min(100, this.connection + 4 + Math.random() * 4);
            this.peakConnection = Math.max(this.peakConnection, this.connection);
            connectionFill.style.width = this.connection + '%';
            connectionValue.textContent = Math.round(this.connection) + '%';
            
            // Heart pulse at high connection
            if (this.connection > 70) {
                heart.classList.add('pulse');
            }
            
            await this.wait(exhale);
            if (this.sessionActive) breathCycle();
        };
        
        await this.wait(2000);
        breathCycle();
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    completeSession() {
        this.sessionActive = false;
        
        // Update streak
        this.streak++;
        localStorage.setItem('familyStreak', this.streak.toString());
        
        // Calculate time
        const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        
        this.$('#statMembers').textContent = this.members.length;
        this.$('#statTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        this.$('#statConnection').textContent = Math.round(this.peakConnection) + '%';
        this.$('#streakCount').textContent = this.streak;
        
        const messages = [
            '"Families that breathe together, grow together."',
            '"Connection is built in small moments."',
            '"You showed up for each other today."',
            '"This is what love looks like."'
        ];
        this.$('#familyMessage').textContent = messages[Math.floor(Math.random() * messages.length)];
        
        // Celebration
        this.playTone(392, 0.3);
        setTimeout(() => this.playTone(523.25, 0.3), 150);
        setTimeout(() => this.playTone(659.25, 0.5), 300);
        
        this.showScreen('completeScreen');
    }
    
    endSession() {
        this.sessionActive = false;
        this.$$('.circle-member').forEach(m => m.classList.remove('inhale', 'exhale'));
        this.$('#centerHeart').classList.remove('pulse');
        this.completeSession();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.familyCircle = new FamilyCircle();
});

