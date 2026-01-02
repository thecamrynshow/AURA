// ============================================
// Classroom Sync — Teacher-Led Regulation
// Real-time sync between teacher and students
// ============================================

class ClassroomSync {
    constructor() {
        this.role = null;
        this.sessionCode = null;
        this.students = [];
        this.exerciseActive = false;
        this.exerciseTimer = null;
        this.breathTimer = null;
        this.audioContext = null;
        this.syncChannel = null;
        this.syncInterval = null;
        
        this.exercises = {
            'breath-reset': { name: 'Breath Reset', duration: 120, inhale: 4, exhale: 4 },
            'grounding': { name: 'Quick Ground', duration: 60, inhale: 3, exhale: 5 },
            'transition': { name: 'Transition', duration: 90, inhale: 4, exhale: 6 },
            'focus': { name: 'Focus Prep', duration: 120, inhale: 4, exhale: 4, hold: 2 },
            'calm-down': { name: 'Calm Down', duration: 180, inhale: 4, exhale: 8 },
            'energy': { name: 'Energy Up', duration: 60, inhale: 2, exhale: 2 }
        };
        
        this.init();
    }
    
    $(s) { return document.querySelector(s); }
    $$(s) { return document.querySelectorAll(s); }
    
    init() {
        this.bindEvents();
    }
    
    generateSessionCode() {
        const words = ['CALM', 'HEAL', 'SYNC', 'FLOW', 'ZONE', 'RISE'];
        const word = words[Math.floor(Math.random() * words.length)];
        const num = Math.floor(1000 + Math.random() * 9000);
        return `${word}-${num}`;
    }
    
    generateStudents() {
        this.students = [];
        const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Oliver', 'Isabella', 'Elijah', 
            'Sophia', 'Lucas', 'Mia', 'Mason', 'Charlotte', 'Logan', 'Amelia', 'Alexander',
            'Harper', 'Ethan', 'Evelyn', 'Aiden', 'Abigail', 'James', 'Emily', 'Benjamin'];
        
        for (let i = 0; i < 24; i++) {
            const states = ['calm', 'alert', 'stressed'];
            const weights = [0.3, 0.5, 0.2];
            const rand = Math.random();
            let state;
            if (rand < weights[0]) state = 'calm';
            else if (rand < weights[0] + weights[1]) state = 'alert';
            else state = 'stressed';
            
            this.students.push({
                id: i + 1,
                name: firstNames[i],
                state: state,
                isReal: false
            });
        }
    }
    
    bindEvents() {
        this.$('#teacherBtn').addEventListener('click', () => this.startTeacherSession());
        this.$('#studentBtn').addEventListener('click', () => this.showJoinScreen());
        this.$('#joinSessionBtn').addEventListener('click', () => this.joinSession());
        this.$('#backToRoleBtn').addEventListener('click', () => this.backToRoleSelect());
        this.$('#endSessionBtn').addEventListener('click', () => this.endSession());
        this.$('#stopExerciseBtn').addEventListener('click', () => this.stopExercise());
        
        // Enter key to join
        this.$('#joinCodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinSession();
        });
        
        // Auto-format code input
        this.$('#joinCodeInput').addEventListener('input', (e) => {
            let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            if (val.length === 4 && !val.includes('-')) {
                val = val + '-';
            }
            e.target.value = val;
        });
        
        this.$$('.exercise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exercise = e.currentTarget.dataset.exercise;
                this.startExercise(exercise);
            });
        });
    }
    
    // ==================== SESSION MANAGEMENT ====================
    
    startTeacherSession() {
        this.role = 'teacher';
        this.sessionCode = this.generateSessionCode();
        this.generateStudents();
        
        // Store session in localStorage for cross-tab/device sync
        const sessionData = {
            code: this.sessionCode,
            active: true,
            exercise: null,
            exerciseData: null,
            breathPhase: null,
            startTime: Date.now()
        };
        localStorage.setItem(`pneuoma_session_${this.sessionCode}`, JSON.stringify(sessionData));
        
        // Setup BroadcastChannel for same-origin tab sync
        this.setupSyncChannel();
        
        // Show teacher screen
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$('#teacherScreen').classList.add('active');
        this.$('#sessionCode').textContent = this.sessionCode;
        
        this.renderClassGrid();
        this.initAudio();
        this.startSimulation();
        
        // Broadcast session started
        this.broadcastState({ type: 'session_started', code: this.sessionCode });
        
        console.log('Teacher session started:', this.sessionCode);
    }
    
    showJoinScreen() {
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$('#joinScreen').classList.add('active');
        this.$('#joinCodeInput').value = '';
        this.$('#codeError').classList.add('hidden');
        this.$('#joinCodeInput').focus();
    }
    
    backToRoleSelect() {
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$('#roleScreen').classList.add('active');
    }
    
    joinSession() {
        const code = this.$('#joinCodeInput').value.toUpperCase().trim();
        
        if (code.length < 8) {
            this.$('#codeError').textContent = 'Please enter the full code (e.g., CALM-1234)';
            this.$('#codeError').classList.remove('hidden');
            return;
        }
        
        // Check if session exists in localStorage
        const sessionData = localStorage.getItem(`pneuoma_session_${code}`);
        
        if (!sessionData) {
            this.$('#codeError').textContent = 'Session not found. Check the code and try again.';
            this.$('#codeError').classList.remove('hidden');
            return;
        }
        
        const session = JSON.parse(sessionData);
        
        if (!session.active) {
            this.$('#codeError').textContent = 'This session has ended.';
            this.$('#codeError').classList.remove('hidden');
            return;
        }
        
        // Successfully joining
        this.role = 'student';
        this.sessionCode = code;
        
        // Setup sync
        this.setupSyncChannel();
        
        // Show student screen
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$('#studentScreen').classList.add('active');
        this.$('#studentSessionCode').textContent = code;
        
        // Notify teacher
        this.broadcastState({ type: 'student_joined', code: code });
        
        // Start listening for updates
        this.startStudentSync();
        
        // Check if exercise is already running
        if (session.exercise) {
            this.syncToExercise(session);
        }
        
        this.initAudio();
        console.log('Joined session:', code);
    }
    
    setupSyncChannel() {
        // BroadcastChannel for real-time sync across tabs
        if ('BroadcastChannel' in window) {
            this.syncChannel = new BroadcastChannel(`pneuoma_classroom_${this.sessionCode}`);
            
            this.syncChannel.onmessage = (event) => {
                this.handleSyncMessage(event.data);
            };
        }
    }
    
    broadcastState(data) {
        // Update localStorage
        if (this.sessionCode) {
            const existingData = localStorage.getItem(`pneuoma_session_${this.sessionCode}`);
            if (existingData) {
                const session = JSON.parse(existingData);
                Object.assign(session, data);
                localStorage.setItem(`pneuoma_session_${this.sessionCode}`, JSON.stringify(session));
            }
        }
        
        // Broadcast to other tabs
        if (this.syncChannel) {
            this.syncChannel.postMessage(data);
        }
    }
    
    handleSyncMessage(data) {
        console.log('Sync message received:', data);
        
        if (this.role === 'student') {
            switch (data.type) {
                case 'exercise_start':
                    this.syncToExercise(data);
                    break;
                case 'exercise_stop':
                    this.studentExerciseStop();
                    break;
                case 'breath_phase':
                    this.syncBreathPhase(data.phase, data.instruction);
                    break;
                case 'session_end':
                    this.studentSessionEnded();
                    break;
            }
        } else if (this.role === 'teacher') {
            if (data.type === 'student_joined') {
                // Add real student indicator
                this.$('#connectedCount').textContent = 
                    parseInt(this.$('#connectedCount').textContent) + 1;
            }
        }
    }
    
    startStudentSync() {
        // Poll localStorage for updates (fallback for cross-device)
        this.syncInterval = setInterval(() => {
            const sessionData = localStorage.getItem(`pneuoma_session_${this.sessionCode}`);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                if (!session.active) {
                    this.studentSessionEnded();
                    return;
                }
                
                // Check for exercise state changes
                if (session.exercise && !this.exerciseActive) {
                    this.syncToExercise(session);
                } else if (!session.exercise && this.exerciseActive) {
                    this.studentExerciseStop();
                }
            }
        }, 500);
    }
    
    // ==================== EXERCISE SYNC ====================
    
    syncToExercise(data) {
        const exercise = this.exercises[data.exercise];
        if (!exercise) return;
        
        this.exerciseActive = true;
        
        this.$('#studentWaiting').classList.add('hidden');
        this.$('#studentComplete').classList.add('hidden');
        this.$('#studentExercise').classList.remove('hidden');
        this.$('#studentExerciseLabel').textContent = exercise.name;
        
        // Start breath cycle
        this.runStudentBreathCycle(exercise);
    }
    
    runStudentBreathCycle(exercise) {
        const inhale = exercise.inhale * 1000;
        const hold = (exercise.hold || 0) * 1000;
        const exhale = exercise.exhale * 1000;
        
        const circle = this.$('#studentBreathCircle');
        const inst = this.$('#studentInstruction');
        
        const cycle = () => {
            if (!this.exerciseActive) return;
            
            // Inhale
            circle.classList.remove('contract');
            circle.classList.add('expand');
            inst.textContent = 'Breathe In';
            this.playTone(220, inhale / 1000);
            
            setTimeout(() => {
                if (!this.exerciseActive) return;
                
                if (hold > 0) {
                    inst.textContent = 'Hold';
                    setTimeout(() => {
                        if (!this.exerciseActive) return;
                        doExhale();
                    }, hold);
                } else {
                    doExhale();
                }
            }, inhale);
            
            const doExhale = () => {
                circle.classList.remove('expand');
                circle.classList.add('contract');
                inst.textContent = 'Breathe Out';
                this.playTone(165, exhale / 1000);
                
                setTimeout(() => {
                    if (this.exerciseActive) cycle();
                }, exhale);
            };
        };
        
        cycle();
    }
    
    syncBreathPhase(phase, instruction) {
        const circle = this.$('#studentBreathCircle');
        const inst = this.$('#studentInstruction');
        
        if (phase === 'inhale') {
            circle.classList.remove('contract');
            circle.classList.add('expand');
        } else {
            circle.classList.remove('expand');
            circle.classList.add('contract');
        }
        
        if (inst) inst.textContent = instruction;
    }
    
    studentExerciseStop() {
        this.exerciseActive = false;
        
        this.$('#studentExercise').classList.add('hidden');
        this.$('#studentComplete').classList.remove('hidden');
        
        this.playTone(523.25, 0.3);
        setTimeout(() => this.playTone(659.25, 0.5), 150);
        
        setTimeout(() => {
            this.$('#studentComplete').classList.add('hidden');
            this.$('#studentWaiting').classList.remove('hidden');
        }, 3000);
    }
    
    studentSessionEnded() {
        clearInterval(this.syncInterval);
        this.exerciseActive = false;
        
        alert('The session has ended. Thanks for participating!');
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$('#roleScreen').classList.add('active');
    }
    
    // ==================== TEACHER FUNCTIONALITY ====================
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not available');
        }
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
        gain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    renderClassGrid() {
        const grid = this.$('#classGrid');
        grid.innerHTML = '';
        
        this.students.forEach(student => {
            const dot = document.createElement('div');
            dot.className = `student-dot ${student.state}`;
            dot.dataset.id = student.id;
            dot.dataset.name = student.name;
            dot.textContent = student.name.charAt(0);
            grid.appendChild(dot);
        });
        
        this.updateStats();
    }
    
    updateStats() {
        const counts = { calm: 0, alert: 0, stressed: 0 };
        this.students.forEach(s => counts[s.state]++);
        
        this.$('#calmCount').textContent = counts.calm;
        this.$('#alertCount').textContent = counts.alert;
        this.$('#stressedCount').textContent = counts.stressed;
        
        const maxCount = Math.max(counts.calm, counts.alert, counts.stressed);
        const coherence = Math.round((maxCount / 24) * 100);
        this.$('#coherenceScore').textContent = coherence + '%';
        
        if (this.$('#liveCoherence')) {
            this.$('#liveCoherence').textContent = coherence + '%';
        }
    }
    
    startSimulation() {
        setInterval(() => {
            if (this.exerciseActive) return;
            
            const student = this.students[Math.floor(Math.random() * this.students.length)];
            const states = ['calm', 'alert', 'stressed'];
            const currentIdx = states.indexOf(student.state);
            
            if (Math.random() > 0.7) {
                if (currentIdx === 0) student.state = 'alert';
                else if (currentIdx === 2) student.state = Math.random() > 0.5 ? 'alert' : 'stressed';
                else student.state = Math.random() > 0.5 ? 'calm' : 'stressed';
            }
            
            if (this.role === 'teacher') {
                this.renderClassGrid();
            }
        }, 3000);
    }
    
    startExercise(exerciseKey) {
        const exercise = this.exercises[exerciseKey];
        if (!exercise) return;
        
        this.exerciseActive = true;
        this.$('#exerciseOverlay').classList.remove('hidden');
        this.$('#activeExerciseName').textContent = exercise.name;
        this.$('#classStatus').textContent = `Leading: ${exercise.name}`;
        
        // Broadcast to students
        this.broadcastState({ 
            type: 'exercise_start', 
            exercise: exerciseKey,
            exerciseData: exercise
        });
        
        let elapsed = 0;
        const total = exercise.duration;
        
        this.exerciseTimer = setInterval(() => {
            elapsed++;
            const percent = (elapsed / total) * 100;
            this.$('#exerciseProgress').style.width = percent + '%';
            
            const remaining = total - elapsed;
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            this.$('#timeRemaining').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            if (elapsed % 5 === 0) {
                this.improveClassState();
            }
            
            if (elapsed >= total) {
                this.completeExercise();
            }
        }, 1000);
        
        this.runBreathCycle(exercise);
    }
    
    runBreathCycle(exercise) {
        const inhale = exercise.inhale * 1000;
        const hold = (exercise.hold || 0) * 1000;
        const exhale = exercise.exhale * 1000;
        
        const teacherCircle = this.$('#breathCircle');
        const teacherInst = this.$('#breathInstruction');
        
        const cycle = () => {
            if (!this.exerciseActive) return;
            
            // Inhale
            teacherCircle.classList.remove('contract');
            teacherCircle.classList.add('expand');
            teacherInst.textContent = 'Breathe In';
            this.playTone(220, inhale / 1000);
            
            // Broadcast phase
            this.broadcastState({ type: 'breath_phase', phase: 'inhale', instruction: 'Breathe In' });
            
            setTimeout(() => {
                if (!this.exerciseActive) return;
                
                if (hold > 0) {
                    teacherInst.textContent = 'Hold';
                    this.broadcastState({ type: 'breath_phase', phase: 'hold', instruction: 'Hold' });
                    
                    setTimeout(() => {
                        if (!this.exerciseActive) return;
                        doExhale();
                    }, hold);
                } else {
                    doExhale();
                }
            }, inhale);
            
            const doExhale = () => {
                teacherCircle.classList.remove('expand');
                teacherCircle.classList.add('contract');
                teacherInst.textContent = 'Breathe Out';
                this.playTone(165, exhale / 1000);
                
                this.broadcastState({ type: 'breath_phase', phase: 'exhale', instruction: 'Breathe Out' });
                
                setTimeout(() => {
                    if (this.exerciseActive) cycle();
                }, exhale);
            };
        };
        
        cycle();
    }
    
    improveClassState() {
        this.students.forEach(student => {
            if (Math.random() > 0.6) {
                if (student.state === 'stressed') {
                    student.state = 'alert';
                } else if (student.state === 'alert') {
                    student.state = Math.random() > 0.4 ? 'calm' : 'alert';
                }
            }
        });
        
        if (this.role === 'teacher') {
            this.renderClassGrid();
        }
    }
    
    completeExercise() {
        this.stopExercise();
        this.playTone(523.25, 0.3);
        setTimeout(() => this.playTone(659.25, 0.5), 150);
    }
    
    stopExercise() {
        this.exerciseActive = false;
        clearInterval(this.exerciseTimer);
        
        this.$('#exerciseOverlay').classList.add('hidden');
        this.$('#classStatus').textContent = 'Ready';
        this.$('#exerciseProgress').style.width = '0%';
        
        const teacherCircle = this.$('#breathCircle');
        if (teacherCircle) {
            teacherCircle.classList.remove('expand', 'contract');
        }
        
        // Broadcast stop
        this.broadcastState({ type: 'exercise_stop', exercise: null });
    }
    
    endSession() {
        this.stopExercise();
        clearInterval(this.syncInterval);
        
        // Mark session as ended
        if (this.sessionCode) {
            const sessionData = localStorage.getItem(`pneuoma_session_${this.sessionCode}`);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                session.active = false;
                localStorage.setItem(`pneuoma_session_${this.sessionCode}`, JSON.stringify(session));
            }
            
            this.broadcastState({ type: 'session_end' });
        }
        
        if (this.syncChannel) {
            this.syncChannel.close();
        }
        
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$('#roleScreen').classList.add('active');
        this.role = null;
        this.sessionCode = null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.classroomSync = new ClassroomSync();
});
