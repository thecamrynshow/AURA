// ============================================
// Therapy Circle — Group Therapy Regulation
// HIPAA-Ready • No Data Stored
// ============================================

class TherapyCircle {
    constructor() {
        this.isTherapist = false;
        this.expectedParticipants = 6;
        this.sessionFocus = 'grounding';
        this.participants = [];
        this.sessionActive = false;
        this.exerciseActive = false;
        this.coherence = 0;
        this.peakCoherence = 0;
        this.startTime = null;
        this.audioContext = null;
        
        this.exercises = {
            'grounding': { name: '5-4-3-2-1 Ground', duration: 180 },
            'breath': { name: 'Group Breath', duration: 180, inhale: 4, exhale: 6 },
            'body-scan': { name: 'Body Scan', duration: 300 },
            'container': { name: 'Container', duration: 120 }
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
        const code = 'HEAL-' + Math.floor(1000 + Math.random() * 9000);
        this.$('#sessionCode').textContent = code;
        this.$('#dashCode').textContent = code;
    }
    
    bindEvents() {
        // Role selection
        this.$('#therapistBtn').addEventListener('click', () => this.selectRole('therapist'));
        this.$('#clientBtn').addEventListener('click', () => this.selectRole('client'));
        
        // Setup
        this.$('#backBtn').addEventListener('click', () => this.showScreen('roleScreen'));
        this.$$('.part-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.$$('.part-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.expectedParticipants = parseInt(e.target.dataset.count);
            });
        });
        this.$$('.focus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.$$('.focus-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.sessionFocus = e.target.dataset.focus;
            });
        });
        this.$('#startSessionBtn').addEventListener('click', () => this.createSession());
        
        // Waiting room
        this.$('#copyBtn').addEventListener('click', () => this.copyCode());
        this.$('#cancelBtn').addEventListener('click', () => this.showScreen('roleScreen'));
        this.$('#beginBtn').addEventListener('click', () => this.beginSession());
        
        // Client
        this.$('#clientBackBtn').addEventListener('click', () => this.showScreen('roleScreen'));
        this.$('#joinBtn').addEventListener('click', () => this.joinSession());
        
        // Dashboard
        this.$('#endSessionBtn').addEventListener('click', () => this.endSession());
        this.$$('.exercise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exercise = e.currentTarget.dataset.exercise;
                this.startExercise(exercise);
            });
        });
        this.$('#stopBtn').addEventListener('click', () => this.stopExercise());
        
        // Complete
        this.$('#doneBtn').addEventListener('click', () => {
            this.showScreen('roleScreen');
            this.generateCode();
        });
        this.$('#copyNotesBtn').addEventListener('click', () => this.copyNotes());
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
    
    selectRole(role) {
        this.isTherapist = (role === 'therapist');
        if (this.isTherapist) {
            this.showScreen('setupScreen');
        } else {
            this.showScreen('joinScreen');
        }
    }
    
    createSession() {
        this.$('#expectedCount').textContent = this.expectedParticipants;
        this.renderParticipantDots();
        this.showScreen('waitingScreen');
        
        // Simulate participants joining
        this.simulateJoining();
    }
    
    renderParticipantDots() {
        const container = this.$('#participantDots');
        container.innerHTML = '';
        for (let i = 0; i < this.expectedParticipants; i++) {
            const dot = document.createElement('div');
            dot.className = 'participant-dot';
            dot.dataset.index = i;
            container.appendChild(dot);
        }
    }
    
    simulateJoining() {
        let joined = 0;
        const dots = this.$$('.participant-dot');
        
        const joinInterval = setInterval(() => {
            if (joined >= this.expectedParticipants || !this.$('#waitingScreen').classList.contains('active')) {
                clearInterval(joinInterval);
                return;
            }
            
            dots[joined].classList.add('joined');
            joined++;
            this.$('#joinedCount').textContent = joined;
            
            // Add to participants
            const states = ['regulated', 'activating', 'dysregulated'];
            const weights = [0.4, 0.4, 0.2];
            const rand = Math.random();
            let state;
            if (rand < weights[0]) state = 'regulated';
            else if (rand < weights[0] + weights[1]) state = 'activating';
            else state = 'dysregulated';
            
            this.participants.push({
                id: joined,
                state: state
            });
        }, 800);
    }
    
    joinSession() {
        const code = this.$('#joinCode').value.trim().toUpperCase();
        if (code.length < 4) return;
        
        this.showScreen('clientWaitingScreen');
        
        // Simulate session starting
        setTimeout(() => {
            if (this.$('#clientWaitingScreen').classList.contains('active')) {
                this.showScreen('clientExerciseScreen');
                this.runClientExercise();
            }
        }, 3000);
    }
    
    beginSession() {
        this.sessionActive = true;
        this.startTime = Date.now();
        this.initAudio();
        
        const sessionName = this.$('#sessionName').value || 'Group Session';
        this.$('#dashSessionName').textContent = sessionName;
        this.$('#activeCount').textContent = this.participants.length;
        
        this.showScreen('dashboardScreen');
        this.renderCircle();
        this.startCoherenceSimulation();
    }
    
    renderCircle() {
        const circle = this.$('#therapyCircle');
        const center = circle.querySelector('.circle-center');
        
        // Remove old nodes
        circle.querySelectorAll('.member-node').forEach(n => n.remove());
        
        const radius = 120;
        const centerX = 150;
        const centerY = 150;
        
        this.participants.forEach((p, i) => {
            const angle = (i / this.participants.length) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle) - 25;
            const y = centerY + radius * Math.sin(angle) - 25;
            
            const node = document.createElement('div');
            node.className = `member-node ${p.state}`;
            node.textContent = `P${p.id}`;
            node.style.left = x + 'px';
            node.style.top = y + 'px';
            node.dataset.id = p.id;
            circle.appendChild(node);
        });
    }
    
    startCoherenceSimulation() {
        setInterval(() => {
            if (!this.sessionActive) return;
            
            // Randomly change states (simulate real-time data)
            if (!this.exerciseActive) {
                this.participants.forEach(p => {
                    if (Math.random() > 0.85) {
                        const states = ['regulated', 'activating', 'dysregulated'];
                        p.state = states[Math.floor(Math.random() * 3)];
                    }
                });
            }
            
            // Calculate coherence
            const regulated = this.participants.filter(p => p.state === 'regulated').length;
            this.coherence = Math.round((regulated / this.participants.length) * 100);
            this.peakCoherence = Math.max(this.peakCoherence, this.coherence);
            
            this.$('#coherenceValue').textContent = this.coherence + '%';
            if (this.$('#groupCoherence')) {
                this.$('#groupCoherence').textContent = this.coherence + '%';
            }
            
            this.renderCircle();
        }, 2000);
    }
    
    copyCode() {
        const code = this.$('#sessionCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.$('#copyBtn').textContent = 'Copied!';
            setTimeout(() => this.$('#copyBtn').textContent = 'Copy', 2000);
        });
    }
    
    startExercise(exerciseKey) {
        const exercise = this.exercises[exerciseKey];
        if (!exercise) return;
        
        this.exerciseActive = true;
        this.$('#exerciseOverlay').classList.remove('hidden');
        this.$('#exerciseTitle').textContent = exercise.name;
        
        if (exercise.inhale) {
            this.runBreathExercise(exercise);
        } else {
            this.runTimedExercise(exercise);
        }
    }
    
    async runBreathExercise(exercise) {
        const circle = this.$('#groupCircle');
        const instruction = this.$('#breathInstruction');
        const timerFill = this.$('#timerFill');
        const timerValue = this.$('#timerValue');
        
        let elapsed = 0;
        const duration = exercise.duration;
        
        // Timer
        const timerInterval = setInterval(() => {
            elapsed++;
            const remaining = duration - elapsed;
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerValue.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            timerFill.style.width = ((elapsed / duration) * 100) + '%';
            
            // Improve regulation during exercise
            if (elapsed % 3 === 0) {
                this.participants.forEach(p => {
                    if (Math.random() > 0.5) {
                        if (p.state === 'dysregulated') p.state = 'activating';
                        else if (p.state === 'activating') p.state = Math.random() > 0.3 ? 'regulated' : 'activating';
                    }
                });
            }
            
            if (elapsed >= duration) {
                clearInterval(timerInterval);
                this.stopExercise();
            }
        }, 1000);
        
        // Breathing
        const breathCycle = async () => {
            if (!this.exerciseActive) return;
            
            instruction.textContent = 'Breathe In';
            circle.classList.remove('contract');
            circle.classList.add('expand');
            this.playTone(220, exercise.inhale);
            
            await this.wait(exercise.inhale * 1000);
            if (!this.exerciseActive) return;
            
            instruction.textContent = 'Breathe Out';
            circle.classList.remove('expand');
            circle.classList.add('contract');
            this.playTone(165, exercise.exhale);
            
            await this.wait(exercise.exhale * 1000);
            if (this.exerciseActive) breathCycle();
        };
        
        breathCycle();
    }
    
    runTimedExercise(exercise) {
        const timerFill = this.$('#timerFill');
        const timerValue = this.$('#timerValue');
        const instruction = this.$('#breathInstruction');
        
        instruction.textContent = 'Follow the facilitator\'s guidance...';
        
        let elapsed = 0;
        const duration = exercise.duration;
        
        const timerInterval = setInterval(() => {
            elapsed++;
            const remaining = duration - elapsed;
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerValue.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            timerFill.style.width = ((elapsed / duration) * 100) + '%';
            
            if (elapsed >= duration) {
                clearInterval(timerInterval);
                this.stopExercise();
            }
        }, 1000);
    }
    
    runClientExercise() {
        const circle = this.$('#clientCircle');
        const instruction = this.$('#clientInstruction');
        
        const breathCycle = async () => {
            if (!this.$('#clientExerciseScreen').classList.contains('active')) return;
            
            instruction.textContent = 'Breathe In';
            circle.classList.remove('contract');
            circle.classList.add('expand');
            
            await this.wait(4000);
            
            instruction.textContent = 'Breathe Out';
            circle.classList.remove('expand');
            circle.classList.add('contract');
            
            await this.wait(6000);
            breathCycle();
        };
        
        breathCycle();
    }
    
    stopExercise() {
        this.exerciseActive = false;
        this.$('#exerciseOverlay').classList.add('hidden');
        this.$('#groupCircle').classList.remove('expand', 'contract');
        this.$('#timerFill').style.width = '0%';
    }
    
    endSession() {
        this.sessionActive = false;
        this.stopExercise();
        
        // Calculate duration
        const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        
        this.$('#summaryDuration').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        this.$('#summaryParticipants').textContent = this.participants.length;
        this.$('#summaryCoherence').textContent = this.peakCoherence + '%';
        
        this.showScreen('completeScreen');
    }
    
    copyNotes() {
        const notes = this.$('#sessionNotes').value;
        const summary = `Session Summary\nDuration: ${this.$('#summaryDuration').textContent}\nParticipants: ${this.participants.length}\nPeak Coherence: ${this.peakCoherence}%\n\nNotes:\n${notes}`;
        
        navigator.clipboard.writeText(summary).then(() => {
            this.$('#copyNotesBtn').textContent = 'Copied!';
            setTimeout(() => this.$('#copyNotesBtn').textContent = 'Copy Notes', 2000);
        });
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.therapyCircle = new TherapyCircle();
});



