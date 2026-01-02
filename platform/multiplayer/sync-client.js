/**
 * PNEUOMA Sync Client
 * Real-time multiplayer connection helper
 * 
 * Usage:
 *   const sync = new PneuomaSync();
 *   await sync.connect();
 *   sync.createSession('classroom', 'Teacher Name');
 */

class PneuomaSync {
    constructor(options = {}) {
        // Server URL - change this when you deploy
        this.serverUrl = options.serverUrl || this.detectServerUrl();
        this.socket = null;
        this.sessionCode = null;
        this.isHost = false;
        this.connected = false;
        
        // Callbacks
        this.onConnect = options.onConnect || (() => {});
        this.onDisconnect = options.onDisconnect || (() => {});
        this.onSessionUpdate = options.onSessionUpdate || (() => {});
        this.onParticipantJoined = options.onParticipantJoined || (() => {});
        this.onParticipantLeft = options.onParticipantLeft || (() => {});
        this.onExerciseStart = options.onExerciseStart || (() => {});
        this.onExerciseStop = options.onExerciseStop || (() => {});
        this.onBreathSync = options.onBreathSync || (() => {});
        this.onSessionEnded = options.onSessionEnded || (() => {});
        this.onError = options.onError || ((err) => console.error('Sync error:', err));
    }

    detectServerUrl() {
        // Auto-detect based on current environment
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        // Production server URL - update this when deployed
        return 'https://pneuoma-sync.onrender.com'; // Example Render URL
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Load Socket.io if not already loaded
                if (typeof io === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
                    script.onload = () => this.initSocket(resolve, reject);
                    script.onerror = () => reject(new Error('Failed to load Socket.io'));
                    document.head.appendChild(script);
                } else {
                    this.initSocket(resolve, reject);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    initSocket(resolve, reject) {
        try {
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to PNEUOMA sync server');
                this.connected = true;
                this.onConnect();
                resolve(this);
            });

            this.socket.on('connect_error', (error) => {
                console.warn('⚠️ Connection error:', error.message);
                this.onError(error);
                // Don't reject - allow fallback to local mode
                resolve(this);
            });

            this.socket.on('disconnect', () => {
                console.log('🔌 Disconnected from sync server');
                this.connected = false;
                this.onDisconnect();
            });

            // Session events
            this.socket.on('session_update', (data) => {
                this.onSessionUpdate(data);
            });

            this.socket.on('participant_joined', (data) => {
                this.onParticipantJoined(data);
            });

            this.socket.on('participant_left', (data) => {
                this.onParticipantLeft(data);
            });

            // Exercise events
            this.socket.on('exercise_start', (data) => {
                this.onExerciseStart(data);
            });

            this.socket.on('exercise_stop', (data) => {
                this.onExerciseStop(data);
            });

            // Breath sync
            this.socket.on('breath_sync', (data) => {
                this.onBreathSync(data);
            });

            // Session ended
            this.socket.on('session_ended', (data) => {
                this.sessionCode = null;
                this.isHost = false;
                this.onSessionEnded(data);
            });

            // Timeout fallback
            setTimeout(() => {
                if (!this.connected) {
                    console.log('⏱️ Connection timeout - using local mode');
                    resolve(this);
                }
            }, 5000);

        } catch (error) {
            reject(error);
        }
    }

    // ==================== SESSION MANAGEMENT ====================

    createSession(type = 'general', name = 'Host', prefix = null) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                // Fallback: generate local code
                const code = this.generateLocalCode(prefix);
                this.sessionCode = code;
                this.isHost = true;
                resolve({ success: true, code, local: true });
                return;
            }

            this.socket.emit('create_session', { type, name, prefix }, (response) => {
                if (response.success) {
                    this.sessionCode = response.code;
                    this.isHost = true;
                    resolve(response);
                } else {
                    reject(new Error(response.error || 'Failed to create session'));
                }
            });
        });
    }

    joinSession(code, name = 'Participant', role = 'participant') {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                // Can't join without server connection
                reject(new Error('Not connected to server. Cannot join remote session.'));
                return;
            }

            this.socket.emit('join_session', { code: code.toUpperCase(), name, role }, (response) => {
                if (response.success) {
                    this.sessionCode = response.code;
                    this.isHost = false;
                    resolve(response);
                } else {
                    reject(new Error(response.error || 'Failed to join session'));
                }
            });
        });
    }

    // ==================== EXERCISE CONTROL ====================

    startExercise(exercise, exerciseData) {
        if (!this.isHost || !this.sessionCode) return;

        if (this.connected) {
            this.socket.emit('start_exercise', {
                code: this.sessionCode,
                exercise,
                exerciseData
            });
        }
    }

    stopExercise() {
        if (!this.isHost || !this.sessionCode) return;

        if (this.connected) {
            this.socket.emit('stop_exercise', {
                code: this.sessionCode
            });
        }
    }

    // ==================== BREATH SYNC ====================

    sendBreathPhase(phase, instruction) {
        if (!this.isHost || !this.sessionCode) return;

        if (this.connected) {
            this.socket.emit('breath_phase', {
                code: this.sessionCode,
                phase,
                instruction
            });
        }
    }

    // ==================== PARTICIPANT STATE ====================

    updateState(state) {
        if (!this.sessionCode) return;

        if (this.connected) {
            this.socket.emit('update_state', {
                code: this.sessionCode,
                state
            });
        }
    }

    // ==================== END SESSION ====================

    endSession() {
        if (!this.isHost || !this.sessionCode) return;

        if (this.connected) {
            this.socket.emit('end_session', {
                code: this.sessionCode
            });
        }

        this.sessionCode = null;
        this.isHost = false;
    }

    // ==================== UTILITIES ====================

    generateLocalCode(prefix = null) {
        const prefixes = ['CALM', 'HEAL', 'SYNC', 'FLOW', 'ZONE', 'RISE'];
        const word = prefix || prefixes[Math.floor(Math.random() * prefixes.length)];
        const num = Math.floor(1000 + Math.random() * 9000);
        return `${word}-${num}`;
    }

    isConnected() {
        return this.connected;
    }

    getSessionCode() {
        return this.sessionCode;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.connected = false;
        this.sessionCode = null;
        this.isHost = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PneuomaSync;
}

console.log('🔗 PNEUOMA Sync Client loaded');

