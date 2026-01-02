// ============================================
// Classroom Sync — Teacher-Led Regulation
// Real-time sync between teacher and students
// Uses PNEUOMA Sync Server for cross-device sync
// ============================================

class ClassroomSync {
    constructor() {
        this.role = null;
        this.sessionCode = null;
        this.studentName = null;
        this.students = new Map(); // Real students only - Map of id -> student data
        this.exerciseActive = false;
        this.exerciseTimer = null;
        this.breathTimer = null;
        this.audioContext = null;
        this.sync = null; // PneuomaSync client
        
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
    
    async init() {
        this.bindEvents();
        await this.initSync();
    }
    
    async initSync() {
        console.log('🔄 Initializing sync connection...');
        
        // Initialize real-time sync client
        this.sync = new PneuomaSync({
            onConnect: () => {
                console.log('🟢 Connected to sync server!');
                this.updateConnectionStatus(true);
                this.showConnectionToast('Connected to PNEUOMA Sync!', 'success');
            },
            onDisconnect: () => {
                console.log('🔴 Disconnected from sync server');
                this.updateConnectionStatus(false);
            },
            onParticipantJoined: (data) => {
                console.log(`👋 ${data.name} joined! ID: ${data.participantId}`, data);
                if (this.role === 'teacher') {
                    this.addStudent(data.participantId, data.name);
                }
            },
            onParticipantLeft: (data) => {
                console.log(`👋 ${data.name || data.participantId} left`, data);
                if (this.role === 'teacher') {
                    this.removeStudent(data.participantId);
                }
            },
            onExerciseStart: (data) => {
                if (this.role === 'student') {
                    this.syncToExercise(data);
                }
            },
            onExerciseStop: () => {
                if (this.role === 'student') {
                    this.studentExerciseStop();
                }
            },
            onBreathSync: (data) => {
                if (this.role === 'student') {
                    this.syncBreathPhase(data.phase, data.instruction);
                }
            },
            onSessionEnded: (data) => {
                if (this.role === 'student') {
                    this.studentSessionEnded(data.message);
                }
            }
        });
        
        try {
            await this.sync.connect();
            console.log('✅ Sync client initialized, connected:', this.sync.isConnected());
        } catch (e) {
            console.log('⚠️ Using local-only mode:', e.message);
            this.showConnectionToast('Offline mode - sessions won\'t sync across devices', 'warning');
        }
    }
    
    updateConnectionStatus(connected) {
        // Update header badge
        const badge = this.$('.connection-status');
        if (badge) {
            badge.classList.toggle('connected', connected);
            badge.textContent = connected ? '🟢 Live' : '🟡 Local';
        }
        
        // Update join screen status
        const joinStatus = this.$('#joinConnectionStatus');
        if (joinStatus) {
            const dot = joinStatus.querySelector('.status-dot');
            const text = joinStatus.querySelector('.status-text');
            if (connected) {
                dot.style.background = '#10b981';
                text.textContent = 'Connected to PNEUOMA';
                joinStatus.style.background = 'rgba(16, 185, 129, 0.1)';
                joinStatus.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            } else {
                dot.style.background = '#f59e0b';
                text.textContent = 'Connecting...';
                joinStatus.style.background = 'rgba(245, 158, 11, 0.1)';
                joinStatus.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            }
        }
    }
    
    showConnectionToast(message, type = 'info') {
        // Remove existing toast
        const existing = this.$('.connection-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `connection-toast ${type}`;
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideUp 0.3s ease;
            ${type === 'success' ? 'background: #10b981; color: white;' : ''}
            ${type === 'warning' ? 'background: #f59e0b; color: white;' : ''}
            ${type === 'error' ? 'background: #ef4444; color: white;' : ''}
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 4000);
    }
    
    generateSessionCode() {
        const words = ['CALM', 'HEAL', 'SYNC', 'FLOW', 'ZONE', 'RISE'];
        const word = words[Math.floor(Math.random() * words.length)];
        const num = Math.floor(1000 + Math.random() * 9000);
        return `${word}-${num}`;
    }
    
    // Add a real student when they join
    addStudent(id, name) {
        if (this.role !== 'teacher') return;
        
        this.students.set(id, {
            id: id,
            name: name || 'Anonymous',
            state: 'calm', // Start calm
            joinTime: Date.now()
        });
        
        this.updateTeacherUI();
        this.showConnectionToast(`${name || 'A student'} joined!`, 'success');
    }
    
    // Remove a student when they leave
    removeStudent(id) {
        if (this.role !== 'teacher') return;
        
        const student = this.students.get(id);
        if (student) {
            this.students.delete(id);
            this.updateTeacherUI();
            this.showConnectionToast(`${student.name} left`, 'warning');
        }
    }
    
    // Update the entire teacher UI based on real students
    updateTeacherUI() {
        const count = this.students.size;
        
        // Update header count
        this.$('#connectedCount').textContent = count;
        this.$('#studentLabel').textContent = count === 1 ? 'student' : 'students';
        
        // Show/hide waiting message vs student grid
        const waitingDiv = this.$('#waitingForStudents');
        const gridDiv = this.$('#classGrid');
        
        if (count === 0) {
            if (waitingDiv) waitingDiv.classList.remove('hidden');
            if (gridDiv) gridDiv.classList.add('hidden');
        } else {
            if (waitingDiv) waitingDiv.classList.add('hidden');
            if (gridDiv) gridDiv.classList.remove('hidden');
            this.renderClassGrid();
        }
        
        this.updateStats();
    }
    
    bindEvents() {
        this.$('#teacherBtn').addEventListener('click', () => this.startTeacherSession());
        this.$('#studentBtn').addEventListener('click', () => this.showJoinScreen());
        this.$('#joinSessionBtn').addEventListener('click', () => this.joinSession());
        this.$('#backToRoleBtn').addEventListener('click', () => this.backToRoleSelect());
        this.$('#endSessionBtn').addEventListener('click', () => this.endSession());
        this.$('#stopExerciseBtn').addEventListener('click', () => this.stopExercise());
        
        // Copy code button
        const copyBtn = this.$('#copyCodeBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copySessionCode());
        }
        
        // Enter key to join
        this.$('#joinCodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinSession();
        });
        
        this.$('#studentNameInput')?.addEventListener('keypress', (e) => {
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
        
        // Anonymous checkbox toggles name input
        const anonCheck = this.$('#anonymousCheck');
        const nameInput = this.$('#studentNameInput');
        if (anonCheck && nameInput) {
            anonCheck.addEventListener('change', (e) => {
                nameInput.disabled = e.target.checked;
                if (e.target.checked) {
                    nameInput.value = '';
                    nameInput.placeholder = 'Anonymous';
                } else {
                    nameInput.placeholder = 'Enter your name';
                }
            });
        }
        
        this.$$('.exercise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exercise = e.currentTarget.dataset.exercise;
                this.startExercise(exercise);
            });
        });
    }
    
    copySessionCode() {
        if (this.sessionCode) {
            navigator.clipboard.writeText(this.sessionCode).then(() => {
                const btn = this.$('#copyCodeBtn');
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = 'Copy';
                    btn.classList.remove('copied');
                }, 2000);
            });
        }
    }
    
    // ==================== SESSION MANAGEMENT ====================
    
    async startTeacherSession() {
        this.role = 'teacher';
        this.students = new Map(); // Start fresh with no students
        
        // Create session via sync server
        try {
            const result = await this.sync.createSession('classroom', 'Teacher', 'CALM');
            this.sessionCode = result.code;
        } catch (e) {
            // Fallback to local code
            this.sessionCode = this.generateSessionCode();
        }
        
        // Also store in localStorage for fallback
        const sessionData = {
            code: this.sessionCode,
            active: true,
            exercise: null,
            exerciseData: null,
            breathPhase: null,
            startTime: Date.now()
        };
        localStorage.setItem(`pneuoma_session_${this.sessionCode}`, JSON.stringify(sessionData));
        
        // Setup BroadcastChannel for same-origin tab sync (fallback)
        this.setupSyncChannel();
        
        // Show teacher screen
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$('#teacherScreen').classList.add('active');
        this.$('#sessionCode').textContent = this.sessionCode;
        this.$('#shareCode').textContent = this.sessionCode;
        
        // Update UI to show waiting for students
        this.updateTeacherUI();
        this.initAudio();
        
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
    
    async joinSession() {
        const code = this.$('#joinCodeInput').value.toUpperCase().trim();
        const isAnonymous = this.$('#anonymousCheck')?.checked;
        const nameInput = this.$('#studentNameInput')?.value.trim();
        
        // Get student name
        if (isAnonymous) {
            this.studentName = 'Anonymous';
        } else if (!nameInput) {
            this.$('#codeError').textContent = 'Please enter your name or choose anonymous';
            this.$('#codeError').classList.remove('hidden');
            return;
        } else {
            this.studentName = nameInput;
        }
        
        if (code.length < 8) {
            this.$('#codeError').textContent = 'Please enter the full code (e.g., CALM-1234)';
            this.$('#codeError').classList.remove('hidden');
            return;
        }
        
        // Try to join via sync server first
        if (this.sync && this.sync.isConnected()) {
            console.log('🔄 Attempting to join session via server:', code, 'as', this.studentName);
            try {
                const result = await this.sync.joinSession(code, this.studentName, 'student');
                
                this.role = 'student';
                this.sessionCode = code;
                
                // Show student screen
                this.$$('.screen').forEach(s => s.classList.remove('active'));
                this.$('#studentScreen').classList.add('active');
                this.$('#studentSessionCode').textContent = code;
                this.$('#studentNameDisplay').textContent = this.studentName;
                
                // Check if exercise is already running
                if (result.session && result.session.exercise) {
                    this.syncToExercise(result.session);
                }
                
                this.initAudio();
                this.showConnectionToast('Joined session!', 'success');
                console.log('✅ Joined session via server:', code);
                return;
            } catch (e) {
                console.log('❌ Server join failed:', e.message);
                this.$('#codeError').textContent = e.message || 'Session not found. Check the code and try again.';
                this.$('#codeError').classList.remove('hidden');
                return;
            }
        } else {
            console.log('⚠️ Not connected to server, trying local fallback');
        }
        
        // Fallback: Check localStorage
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
        
        // Successfully joining locally
        this.role = 'student';
        this.sessionCode = code;
        
        // Setup local sync
        this.setupSyncChannel();
        
        // Show student screen
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$('#studentScreen').classList.add('active');
        this.$('#studentSessionCode').textContent = code;
        this.$('#studentNameDisplay').textContent = this.studentName;
        
        // Notify teacher via local broadcast with student name
        this.broadcastState({ 
            type: 'student_joined', 
            code: code,
            studentId: Date.now().toString(),
            studentName: this.studentName
        });
        
        // Start listening for updates
        this.startStudentSync();
        
        // Check if exercise is already running
        if (session.exercise) {
            this.syncToExercise(session);
        }
        
        this.initAudio();
        console.log('Joined session locally:', code, 'as', this.studentName);
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
                // Add real student via local broadcast
                this.addStudent(data.studentId, data.studentName);
            } else if (data.type === 'student_left') {
                this.removeStudent(data.studentId);
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
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.students.forEach((student, id) => {
            const dot = document.createElement('div');
            dot.className = `student-dot ${student.state}`;
            dot.dataset.id = id;
            dot.dataset.name = student.name;
            
            // Show first letter or emoji for anonymous
            if (student.name === 'Anonymous') {
                dot.textContent = '👤';
                dot.style.fontSize = '1rem';
            } else {
                dot.textContent = student.name.charAt(0).toUpperCase();
            }
            
            grid.appendChild(dot);
        });
    }
    
    updateStats() {
        const counts = { calm: 0, alert: 0, stressed: 0 };
        const total = this.students.size;
        
        this.students.forEach(s => counts[s.state]++);
        
        this.$('#calmCount').textContent = counts.calm;
        this.$('#alertCount').textContent = counts.alert;
        this.$('#stressedCount').textContent = counts.stressed;
        
        // Calculate coherence based on actual students
        let coherence;
        if (total === 0) {
            coherence = '--';
        } else {
            const maxCount = Math.max(counts.calm, counts.alert, counts.stressed);
            coherence = Math.round((maxCount / total) * 100) + '%';
        }
        
        this.$('#coherenceScore').textContent = coherence;
        
        if (this.$('#liveCoherence')) {
            this.$('#liveCoherence').textContent = coherence;
        }
    }
    
    // Simulate natural state changes (subtle, for realism)
    // Called periodically during exercise to show student states changing
    simulateStateChanges() {
        if (this.students.size === 0) return;
        
        const studentsArray = Array.from(this.students.values());
        const randomStudent = studentsArray[Math.floor(Math.random() * studentsArray.length)];
        const states = ['calm', 'alert', 'stressed'];
        const currentIdx = states.indexOf(randomStudent.state);
        
        // Subtle random changes
        if (Math.random() > 0.7) {
            if (currentIdx === 0) randomStudent.state = 'alert';
            else if (currentIdx === 2) randomStudent.state = Math.random() > 0.5 ? 'alert' : 'stressed';
            else randomStudent.state = Math.random() > 0.5 ? 'calm' : 'stressed';
            
            if (this.role === 'teacher') {
                this.renderClassGrid();
                this.updateStats();
            }
        }
    }
    
    startExercise(exerciseKey) {
        const exercise = this.exercises[exerciseKey];
        if (!exercise) return;
        
        this.exerciseActive = true;
        this.$('#exerciseOverlay').classList.remove('hidden');
        this.$('#activeExerciseName').textContent = exercise.name;
        this.$('#classStatus').textContent = `Leading: ${exercise.name}`;
        
        // Broadcast to students via sync server
        if (this.sync) {
            this.sync.startExercise(exerciseKey, exercise);
        }
        
        // Also broadcast locally
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
            
            // Broadcast phase via sync server
            if (this.sync) {
                this.sync.sendBreathPhase('inhale', 'Breathe In');
            }
            this.broadcastState({ type: 'breath_phase', phase: 'inhale', instruction: 'Breathe In' });
            
            setTimeout(() => {
                if (!this.exerciseActive) return;
                
                if (hold > 0) {
                    teacherInst.textContent = 'Hold';
                    if (this.sync) {
                        this.sync.sendBreathPhase('hold', 'Hold');
                    }
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
                
                if (this.sync) {
                    this.sync.sendBreathPhase('exhale', 'Breathe Out');
                }
                this.broadcastState({ type: 'breath_phase', phase: 'exhale', instruction: 'Breathe Out' });
                
                setTimeout(() => {
                    if (this.exerciseActive) cycle();
                }, exhale);
            };
        };
        
        cycle();
    }
    
    improveClassState() {
        if (this.students.size === 0) return;
        
        this.students.forEach((student) => {
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
            this.updateStats();
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
        
        // Broadcast stop via sync server
        if (this.sync && this.role === 'teacher') {
            this.sync.stopExercise();
        }
        this.broadcastState({ type: 'exercise_stop', exercise: null });
    }
    
    endSession() {
        this.stopExercise();
        clearInterval(this.syncInterval);
        
        // End session via sync server
        if (this.sync && this.role === 'teacher') {
            this.sync.endSession();
        }
        
        // Mark session as ended in localStorage
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
        this.studentName = null;
        this.students = new Map();
    }
    
    studentSessionEnded(message) {
        clearInterval(this.syncInterval);
        this.exerciseActive = false;
        
        alert(message || 'The session has ended. Thanks for participating!');
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
