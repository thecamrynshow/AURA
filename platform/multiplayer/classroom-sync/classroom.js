// ============================================
// Classroom Sync — Teacher-Led Regulation
// Whole-class co-regulation experience
// ============================================

class ClassroomSync {
    constructor() {
        this.role = null;
        this.students = [];
        this.exerciseActive = false;
        this.exerciseTimer = null;
        this.breathTimer = null;
        this.audioContext = null;
        
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
        this.generateStudents();
        this.bindEvents();
        this.startSimulation();
    }
    
    generateStudents() {
        const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Oliver', 'Isabella', 'Elijah', 
            'Sophia', 'Lucas', 'Mia', 'Mason', 'Charlotte', 'Logan', 'Amelia', 'Alexander',
            'Harper', 'Ethan', 'Evelyn', 'Aiden', 'Abigail', 'James', 'Emily', 'Benjamin'];
        
        for (let i = 0; i < 24; i++) {
            const states = ['calm', 'alert', 'stressed'];
            const weights = [0.3, 0.5, 0.2]; // Initial distribution
            const rand = Math.random();
            let state;
            if (rand < weights[0]) state = 'calm';
            else if (rand < weights[0] + weights[1]) state = 'alert';
            else state = 'stressed';
            
            this.students.push({
                id: i + 1,
                name: firstNames[i],
                state: state
            });
        }
    }
    
    bindEvents() {
        this.$('#teacherBtn').addEventListener('click', () => this.selectRole('teacher'));
        this.$('#studentBtn').addEventListener('click', () => this.selectRole('student'));
        this.$('#endSessionBtn').addEventListener('click', () => this.endSession());
        this.$('#stopExerciseBtn').addEventListener('click', () => this.stopExercise());
        
        this.$$('.exercise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exercise = e.currentTarget.dataset.exercise;
                this.startExercise(exercise);
            });
        });
    }
    
    selectRole(role) {
        this.role = role;
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        
        if (role === 'teacher') {
            this.$('#teacherScreen').classList.add('active');
            this.renderClassGrid();
            this.initAudio();
        } else {
            this.$('#studentScreen').classList.add('active');
        }
    }
    
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
        
        // Coherence: how synchronized is the class
        const maxCount = Math.max(counts.calm, counts.alert, counts.stressed);
        const coherence = Math.round((maxCount / 24) * 100);
        this.$('#coherenceScore').textContent = coherence + '%';
        
        if (this.$('#liveCoherence')) {
            this.$('#liveCoherence').textContent = coherence + '%';
        }
    }
    
    startSimulation() {
        // Simulate students changing states over time
        setInterval(() => {
            if (this.exerciseActive) return; // Don't change during exercise
            
            // Random state changes
            const student = this.students[Math.floor(Math.random() * this.students.length)];
            const states = ['calm', 'alert', 'stressed'];
            const currentIdx = states.indexOf(student.state);
            
            // Tend toward alert (middle state)
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
        
        // Also update student view if in student mode
        if (this.role === 'student') {
            this.$('#studentWaiting').classList.add('hidden');
            this.$('#studentExercise').classList.remove('hidden');
            this.$('#studentExerciseLabel').textContent = exercise.name;
        }
        
        let elapsed = 0;
        const total = exercise.duration;
        
        // Progress timer
        this.exerciseTimer = setInterval(() => {
            elapsed++;
            const percent = (elapsed / total) * 100;
            this.$('#exerciseProgress').style.width = percent + '%';
            
            const remaining = total - elapsed;
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            this.$('#timeRemaining').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            // Improve student states during exercise
            if (elapsed % 5 === 0) {
                this.improveClassState();
            }
            
            if (elapsed >= total) {
                this.completeExercise();
            }
        }, 1000);
        
        // Start breathing animation
        this.runBreathCycle(exercise);
    }
    
    runBreathCycle(exercise) {
        const inhale = exercise.inhale * 1000;
        const hold = (exercise.hold || 0) * 1000;
        const exhale = exercise.exhale * 1000;
        
        const teacherCircle = this.$('#breathCircle');
        const studentCircle = this.$('#studentBreathCircle');
        const teacherInst = this.$('#breathInstruction');
        const studentInst = this.$('#studentInstruction');
        
        const cycle = () => {
            if (!this.exerciseActive) return;
            
            // Inhale
            if (teacherCircle) {
                teacherCircle.classList.remove('contract');
                teacherCircle.classList.add('expand');
            }
            if (studentCircle) {
                studentCircle.classList.remove('contract');
                studentCircle.classList.add('expand');
            }
            if (teacherInst) teacherInst.textContent = 'Breathe In';
            if (studentInst) studentInst.textContent = 'Breathe In';
            this.playTone(220, inhale / 1000);
            
            setTimeout(() => {
                if (!this.exerciseActive) return;
                
                if (hold > 0) {
                    if (teacherInst) teacherInst.textContent = 'Hold';
                    if (studentInst) studentInst.textContent = 'Hold';
                    
                    setTimeout(() => {
                        if (!this.exerciseActive) return;
                        doExhale();
                    }, hold);
                } else {
                    doExhale();
                }
            }, inhale);
            
            const doExhale = () => {
                if (teacherCircle) {
                    teacherCircle.classList.remove('expand');
                    teacherCircle.classList.add('contract');
                }
                if (studentCircle) {
                    studentCircle.classList.remove('expand');
                    studentCircle.classList.add('contract');
                }
                if (teacherInst) teacherInst.textContent = 'Breathe Out';
                if (studentInst) studentInst.textContent = 'Breathe Out';
                this.playTone(165, exhale / 1000);
                
                setTimeout(() => {
                    if (this.exerciseActive) cycle();
                }, exhale);
            };
        };
        
        cycle();
    }
    
    improveClassState() {
        // During exercises, students tend to calm down
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
        
        // Show completion in student view
        if (this.role === 'student') {
            this.$('#studentExercise').classList.add('hidden');
            this.$('#studentComplete').classList.remove('hidden');
            
            setTimeout(() => {
                this.$('#studentComplete').classList.add('hidden');
                this.$('#studentWaiting').classList.remove('hidden');
            }, 3000);
        }
        
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
    }
    
    endSession() {
        this.stopExercise();
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$('#roleScreen').classList.add('active');
        this.role = null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.classroomSync = new ClassroomSync();
});

