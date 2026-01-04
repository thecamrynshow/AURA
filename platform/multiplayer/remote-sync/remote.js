// ============================================
// Remote Sync — Long-Distance Co-Regulation
// Breathe together, anywhere on Earth
// ============================================

class RemoteSync {
    constructor() {
        this.relationship = null;
        this.mode = null;
        this.sessionActive = false;
        this.syncLevel = 0;
        this.peakSync = 0;
        this.startTime = null;
        this.distance = Math.floor(1000 + Math.random() * 8000); // Random distance
        this.audioContext = null;
        this.streak = parseInt(localStorage.getItem('remoteSyncStreak') || '0');
        this.recording = false;
        this.recordTime = 0;
        
        this.sessionDurations = {
            realtime: 300, // 5 min
            async: 180,    // 3 min
            scheduled: 300
        };
        
        this.breathPatterns = {
            family: { inhale: 4, exhale: 4 },
            friend: { inhale: 4, exhale: 5 },
            partner: { inhale: 4, exhale: 6 },
            therapist: { inhale: 4, exhale: 7 },
            support: { inhale: 4, exhale: 6 }
        };
        
        this.relationshipLabels = {
            family: 'Family Member',
            friend: 'Friend',
            partner: 'Partner',
            therapist: 'Therapist',
            support: 'Support Person'
        };
        
        this.guidanceMessages = [
            "Breathe together...",
            "Feel the connection...",
            "Distance fades with breath...",
            "You're not alone...",
            "Syncing hearts across miles...",
            "Together in this moment..."
        ];
        
        this.init();
    }
    
    $(s) { return document.querySelector(s); }
    $$(s) { return document.querySelectorAll(s); }
    
    init() {
        this.bindEvents();
        this.generateCode();
    }
    
    generateCode() {
        const code = 'SYNC-' + Math.floor(1000 + Math.random() * 9000);
        this.$('#sessionCode').textContent = code;
    }
    
    bindEvents() {
        // Welcome
        this.$('#createBtn').addEventListener('click', () => this.showScreen('setupScreen'));
        this.$('#joinBtn').addEventListener('click', () => this.joinSession());
        this.$('#scheduleBtn').addEventListener('click', () => this.showScreen('scheduleScreen'));
        
        // Setup
        this.$('#backToWelcome').addEventListener('click', () => this.showScreen('welcomeScreen'));
        this.$$('.rel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.relationship = e.currentTarget.dataset.rel;
                this.showScreen('modeScreen');
            });
        });
        
        // Mode
        this.$('#backToSetup').addEventListener('click', () => this.showScreen('setupScreen'));
        this.$$('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.mode = e.currentTarget.dataset.mode;
                if (this.mode === 'async') {
                    this.showScreen('asyncScreen');
                } else {
                    this.showWaitingRoom();
                }
            });
        });
        
        // Waiting
        this.$('#cancelBtn').addEventListener('click', () => {
            this.showScreen('welcomeScreen');
            this.generateCode();
        });
        this.$('#copyBtn').addEventListener('click', () => this.copyCode());
        
        // Connected
        this.$('#startBtn').addEventListener('click', () => this.startSession());
        
        // Session
        this.$('#endBtn').addEventListener('click', () => this.endSession());
        
        // Async
        this.$('#recordOrb').addEventListener('click', () => this.toggleRecording());
        this.$('#sendBtn').addEventListener('click', () => this.sendBreath());
        this.$('#backFromAsync').addEventListener('click', () => this.showScreen('modeScreen'));
        
        // Complete
        this.$('#doneBtn').addEventListener('click', () => {
            this.showScreen('welcomeScreen');
            this.generateCode();
        });
        
        // Schedule
        this.$('#backFromSchedule').addEventListener('click', () => this.showScreen('welcomeScreen'));
        this.$('#confirmSchedule').addEventListener('click', () => this.createSchedule());
        
        // Schedule form updates
        this.$('#scheduleDate').addEventListener('change', () => this.updatePreview());
        this.$('#scheduleTime').addEventListener('change', () => this.updatePreview());
        this.$('#timezone').addEventListener('change', () => this.updatePreview());
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
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 0.2);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    showScreen(screenId) {
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$(`#${screenId}`).classList.add('active');
    }
    
    showWaitingRoom() {
        this.$('#distanceDisplay').style.display = 'none';
        this.showScreen('waitingScreen');
        
        // Simulate partner joining
        setTimeout(() => {
            if (this.$('#waitingScreen').classList.contains('active')) {
                this.showConnected();
            }
        }, 3000);
    }
    
    showConnected() {
        this.$('#partnerName').textContent = `Your ${this.relationshipLabels[this.relationship] || 'partner'} is ready`;
        this.$('#connectedDistance').textContent = `${this.distance.toLocaleString()} miles apart`;
        this.showScreen('connectedScreen');
    }
    
    joinSession() {
        const code = this.$('#joinCode').value.trim().toUpperCase();
        if (code.length < 4) return;
        
        // Default settings for join
        this.relationship = 'friend';
        this.mode = 'realtime';
        
        // Go to waiting then connected
        this.showScreen('waitingScreen');
        this.$('#sessionCode').textContent = code;
        
        setTimeout(() => {
            this.showConnected();
        }, 2000);
    }
    
    copyCode() {
        const code = this.$('#sessionCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const btn = this.$('#copyBtn');
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = 'Copy', 2000);
        });
    }
    
    startSession() {
        this.sessionActive = true;
        this.syncLevel = 0;
        this.peakSync = 0;
        this.startTime = Date.now();
        
        this.initAudio();
        this.showScreen('sessionScreen');
        
        const pattern = this.breathPatterns[this.relationship] || { inhale: 4, exhale: 5 };
        this.$('#sessionMode').textContent = this.mode === 'realtime' ? 'Real-Time Sync' : 'Sync';
        this.$('#themLabel').textContent = this.relationshipLabels[this.relationship] || 'Partner';
        this.$('#reminderDistance').textContent = `Breathing together across ${this.distance.toLocaleString()} miles`;
        
        this.runBreathingCycle(pattern);
        this.runTimer();
    }
    
    async runBreathingCycle(pattern) {
        const breathCue = this.$('#breathCue');
        const breathText = this.$('#breathText');
        const youOrb = this.$('#youOrb');
        const themOrb = this.$('#themOrb');
        const syncFill = this.$('#syncFill');
        const syncValue = this.$('#syncValue');
        
        let guidanceIndex = 0;
        
        // Guidance rotation
        const showGuidance = () => {
            if (!this.sessionActive) return;
            breathText.style.opacity = '0';
            setTimeout(() => {
                breathText.textContent = this.guidanceMessages[guidanceIndex % this.guidanceMessages.length];
                breathText.style.opacity = '1';
                guidanceIndex++;
            }, 200);
        };
        
        showGuidance();
        const guidanceInterval = setInterval(showGuidance, 10000);
        
        const breathCycle = async () => {
            if (!this.sessionActive) {
                clearInterval(guidanceInterval);
                return;
            }
            
            const inhale = pattern.inhale * 1000;
            const exhale = pattern.exhale * 1000;
            
            // Inhale
            breathCue.textContent = 'Inhale...';
            youOrb.classList.remove('exhale');
            youOrb.classList.add('inhale');
            themOrb.classList.remove('exhale');
            themOrb.classList.add('inhale');
            this.playTone(220, inhale / 1000);
            
            await this.wait(inhale);
            if (!this.sessionActive) return;
            
            // Exhale
            breathCue.textContent = 'Exhale...';
            youOrb.classList.remove('inhale');
            youOrb.classList.add('exhale');
            themOrb.classList.remove('inhale');
            themOrb.classList.add('exhale');
            this.playTone(165, exhale / 1000);
            
            // Increase sync
            this.syncLevel = Math.min(100, this.syncLevel + 5 + Math.random() * 5);
            this.peakSync = Math.max(this.peakSync, this.syncLevel);
            syncFill.style.width = this.syncLevel + '%';
            syncValue.textContent = Math.round(this.syncLevel) + '%';
            
            await this.wait(exhale);
            if (this.sessionActive) breathCycle();
        };
        
        await this.wait(2000);
        breathCycle();
    }
    
    runTimer() {
        const timer = this.$('#sessionTimer');
        const duration = this.sessionDurations[this.mode] || 300;
        let elapsed = 0;
        
        const interval = setInterval(() => {
            if (!this.sessionActive) {
                clearInterval(interval);
                return;
            }
            
            elapsed++;
            const remaining = duration - elapsed;
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            if (remaining <= 0) {
                clearInterval(interval);
                this.completeSession();
            }
        }, 1000);
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    endSession() {
        this.sessionActive = false;
        this.$$('.sync-orb').forEach(o => {
            o.classList.remove('inhale', 'exhale');
        });
        this.completeSession();
    }
    
    completeSession() {
        this.sessionActive = false;
        
        // Update streak
        this.streak++;
        localStorage.setItem('remoteSyncStreak', this.streak.toString());
        
        // Calculate time
        const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        
        this.$('#statTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        this.$('#statSync').textContent = Math.round(this.peakSync) + '%';
        this.$('#statDistance').textContent = this.distance.toLocaleString();
        this.$('#streakCount').textContent = this.streak;
        
        const quotes = [
            '"Breath knows no borders."',
            '"Distance fades when hearts sync."',
            '"Miles apart, breaths together."',
            '"Connection transcends geography."'
        ];
        this.$('#sessionQuote').textContent = quotes[Math.floor(Math.random() * quotes.length)];
        
        // Celebration
        this.playTone(392, 0.3);
        setTimeout(() => this.playTone(523.25, 0.3), 150);
        setTimeout(() => this.playTone(659.25, 0.5), 300);
        
        this.showScreen('completeScreen');
    }
    
    // Async Mode
    toggleRecording() {
        const orb = this.$('#recordOrb');
        const status = this.$('#recordStatus');
        const timer = this.$('#recordTimer');
        const sendBtn = this.$('#sendBtn');
        
        if (!this.recording) {
            this.recording = true;
            this.recordTime = 0;
            orb.classList.add('recording');
            status.textContent = 'Recording your breath...';
            sendBtn.disabled = true;
            
            this.recordInterval = setInterval(() => {
                this.recordTime++;
                const mins = Math.floor(this.recordTime / 60);
                const secs = this.recordTime % 60;
                timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
                
                if (this.recordTime >= 180) {
                    this.stopRecording();
                }
            }, 1000);
        } else {
            this.stopRecording();
        }
    }
    
    stopRecording() {
        const orb = this.$('#recordOrb');
        const status = this.$('#recordStatus');
        const sendBtn = this.$('#sendBtn');
        
        this.recording = false;
        clearInterval(this.recordInterval);
        orb.classList.remove('recording');
        status.textContent = 'Recording complete!';
        
        if (this.recordTime > 5) {
            sendBtn.disabled = false;
        }
    }
    
    sendBreath() {
        // Simulate sending
        alert('Your breath message has been sent! 📨\n\nYour partner will receive it and can breathe along with you.');
        
        // Reset
        this.recordTime = 0;
        this.$('#recordTimer').textContent = '0:00';
        this.$('#recordStatus').textContent = 'Tap to start recording';
        this.$('#breathMessage').value = '';
        this.$('#sendBtn').disabled = true;
        
        this.showScreen('welcomeScreen');
    }
    
    // Schedule
    updatePreview() {
        const date = this.$('#scheduleDate').value;
        const time = this.$('#scheduleTime').value;
        const tz = this.$('#timezone').value;
        
        if (date && time) {
            // Simple preview (in real app would calculate partner's timezone)
            this.$('#previewTime').textContent = `${time} ${tz} on ${date}`;
        }
    }
    
    createSchedule() {
        const date = this.$('#scheduleDate').value;
        const time = this.$('#scheduleTime').value;
        
        if (!date || !time) {
            alert('Please select a date and time');
            return;
        }
        
        // Generate invite link
        const code = 'SYNC-' + Math.floor(1000 + Math.random() * 9000);
        const link = `pneuoma.com/sync/${code}`;
        
        alert(`Sync scheduled! 📅\n\nShare this link with your partner:\n${link}\n\nWe'll remind you both when it's time to breathe together.`);
        
        this.showScreen('welcomeScreen');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.remoteSync = new RemoteSync();
});



