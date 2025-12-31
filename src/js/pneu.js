/**
 * Project AURA - PNEU Integration
 * Tracks breath patterns, regulation curves, and session data
 */

class PNEUProfile {
    constructor() {
        // Session data
        this.sessionId = this.generateSessionId();
        this.sessionStart = null;
        this.sessionEnd = null;
        
        // Real-time metrics
        this.breathHistory = [];
        this.coherenceHistory = [];
        this.stabilityHistory = [];
        
        // Aggregated scores
        this.avgCoherence = 0;
        this.avgStability = 0;
        this.peakCoherence = 0;
        this.regulationCurve = [];
        
        // Recovery metrics
        this.recoveryEvents = [];
        this.avgRecoveryTime = 0;
        
        // Challenge completion
        this.challengesCompleted = [];
        this.challengeScores = {};
        
        // Dysregulation events
        this.dysregulationEvents = [];
        
        // Local storage key
        this.storageKey = 'aura_pneu_profile';
        
        // Load previous profile data
        this.loadProfile();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    startSession() {
        this.sessionStart = Date.now();
        this.breathHistory = [];
        this.coherenceHistory = [];
        this.stabilityHistory = [];
        this.regulationCurve = [];
        this.recoveryEvents = [];
        this.challengesCompleted = [];
        this.challengeScores = {};
        this.dysregulationEvents = [];
    }

    // Record breath state at regular intervals
    recordBreathState(breathState) {
        const timestamp = Date.now() - this.sessionStart;
        
        this.breathHistory.push({
            time: timestamp,
            level: breathState.level,
            phase: breathState.phase,
            rate: breathState.rate
        });
        
        this.coherenceHistory.push({
            time: timestamp,
            value: breathState.coherence
        });
        
        this.stabilityHistory.push({
            time: timestamp,
            value: breathState.stability
        });
        
        // Track regulation curve (sampled every 5 seconds)
        if (this.regulationCurve.length === 0 || 
            timestamp - this.regulationCurve[this.regulationCurve.length - 1].time > 5000) {
            this.regulationCurve.push({
                time: timestamp,
                coherence: breathState.coherence,
                stability: breathState.stability,
                combined: (breathState.coherence + breathState.stability) / 2
            });
        }
        
        // Track dysregulation events
        if (breathState.stability < 30 && breathState.coherence < 30) {
            const lastEvent = this.dysregulationEvents[this.dysregulationEvents.length - 1];
            if (!lastEvent || timestamp - lastEvent.time > 10000) {
                this.dysregulationEvents.push({
                    time: timestamp,
                    severity: 100 - ((breathState.stability + breathState.coherence) / 2)
                });
            }
        }
        
        // Track recovery events (transition from dysregulated to regulated)
        if (this.dysregulationEvents.length > 0) {
            const lastDysreg = this.dysregulationEvents[this.dysregulationEvents.length - 1];
            if (breathState.stability > 60 && breathState.coherence > 60) {
                const recoveryTime = timestamp - lastDysreg.time;
                if (recoveryTime > 0 && recoveryTime < 60000) {
                    this.recoveryEvents.push({
                        time: timestamp,
                        recoveryTime: recoveryTime
                    });
                }
            }
        }
        
        // Update peak coherence
        if (breathState.coherence > this.peakCoherence) {
            this.peakCoherence = breathState.coherence;
        }
        
        // Keep history manageable
        const maxHistory = 3600; // ~1 minute at 60fps
        if (this.breathHistory.length > maxHistory) {
            this.breathHistory = this.breathHistory.slice(-maxHistory);
            this.coherenceHistory = this.coherenceHistory.slice(-maxHistory);
            this.stabilityHistory = this.stabilityHistory.slice(-maxHistory);
        }
    }

    recordChallengeComplete(challengeId, score) {
        this.challengesCompleted.push({
            id: challengeId,
            time: Date.now() - this.sessionStart,
            score: score
        });
        this.challengeScores[challengeId] = score;
    }

    endSession() {
        this.sessionEnd = Date.now();
        this.calculateFinalScores();
        this.saveSession();
    }

    calculateFinalScores() {
        // Calculate average coherence
        if (this.coherenceHistory.length > 0) {
            this.avgCoherence = this.coherenceHistory.reduce((sum, h) => sum + h.value, 0) / 
                               this.coherenceHistory.length;
        }
        
        // Calculate average stability
        if (this.stabilityHistory.length > 0) {
            this.avgStability = this.stabilityHistory.reduce((sum, h) => sum + h.value, 0) / 
                               this.stabilityHistory.length;
        }
        
        // Calculate average recovery time
        if (this.recoveryEvents.length > 0) {
            this.avgRecoveryTime = this.recoveryEvents.reduce((sum, e) => sum + e.recoveryTime, 0) / 
                                  this.recoveryEvents.length;
        }
    }

    getSessionSummary() {
        const duration = this.sessionEnd ? this.sessionEnd - this.sessionStart : 
                        Date.now() - this.sessionStart;
        
        return {
            sessionId: this.sessionId,
            duration: duration,
            durationFormatted: Utils.formatTime(duration / 1000),
            avgCoherence: Math.round(this.avgCoherence),
            avgStability: Math.round(this.avgStability),
            peakCoherence: Math.round(this.peakCoherence),
            avgRecoveryTime: Math.round(this.avgRecoveryTime / 1000),
            dysregulationCount: this.dysregulationEvents.length,
            challengesCompleted: this.challengesCompleted.length,
            regulationCurve: this.regulationCurve
        };
    }

    // Get insights about what environments/stimuli work for this player
    getInsights() {
        const sessions = this.loadAllSessions();
        
        if (sessions.length < 2) {
            return {
                message: "Complete more sessions to unlock personalized insights.",
                hasEnoughData: false
            };
        }
        
        // Analyze patterns across sessions
        const avgSessionCoherence = sessions.reduce((sum, s) => sum + s.avgCoherence, 0) / sessions.length;
        const avgSessionStability = sessions.reduce((sum, s) => sum + s.avgStability, 0) / sessions.length;
        const avgSessionDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
        
        // Calculate trend
        const recentSessions = sessions.slice(-3);
        const olderSessions = sessions.slice(0, -3);
        
        let trend = 'stable';
        if (recentSessions.length > 0 && olderSessions.length > 0) {
            const recentAvg = recentSessions.reduce((sum, s) => sum + s.avgCoherence, 0) / recentSessions.length;
            const olderAvg = olderSessions.reduce((sum, s) => sum + s.avgCoherence, 0) / olderSessions.length;
            
            if (recentAvg > olderAvg + 5) trend = 'improving';
            if (recentAvg < olderAvg - 5) trend = 'declining';
        }
        
        return {
            hasEnoughData: true,
            totalSessions: sessions.length,
            avgCoherence: Math.round(avgSessionCoherence),
            avgStability: Math.round(avgSessionStability),
            avgDuration: Utils.formatTime(avgSessionDuration / 1000),
            trend: trend,
            insights: this.generateInsights(sessions)
        };
    }

    generateInsights(sessions) {
        const insights = [];
        
        // Check for optimal session length
        const shortSessions = sessions.filter(s => s.duration < 300000); // < 5 min
        const longSessions = sessions.filter(s => s.duration >= 300000);
        
        if (longSessions.length > 0 && shortSessions.length > 0) {
            const shortAvg = shortSessions.reduce((sum, s) => sum + s.avgCoherence, 0) / shortSessions.length;
            const longAvg = longSessions.reduce((sum, s) => sum + s.avgCoherence, 0) / longSessions.length;
            
            if (longAvg > shortAvg + 10) {
                insights.push("Your nervous system benefits from longer sessions (5+ minutes).");
            }
        }
        
        // Check for improvement over time
        if (sessions.length >= 5) {
            const first5 = sessions.slice(0, 5);
            const last5 = sessions.slice(-5);
            
            const firstAvg = first5.reduce((sum, s) => sum + s.avgCoherence, 0) / 5;
            const lastAvg = last5.reduce((sum, s) => sum + s.avgCoherence, 0) / 5;
            
            if (lastAvg > firstAvg + 10) {
                insights.push("Your regulation skills have significantly improved!");
            }
        }
        
        // Check recovery speed
        const avgRecovery = sessions.filter(s => s.avgRecoveryTime > 0)
                                   .reduce((sum, s) => sum + s.avgRecoveryTime, 0) / 
                          sessions.filter(s => s.avgRecoveryTime > 0).length;
        
        if (avgRecovery < 15) {
            insights.push("You recover from dysregulation quickly - excellent resilience.");
        } else if (avgRecovery > 30) {
            insights.push("Practice slow breathing daily to improve recovery speed.");
        }
        
        return insights;
    }

    saveSession() {
        const summary = this.getSessionSummary();
        
        // Save to local storage
        try {
            const sessions = this.loadAllSessions();
            sessions.push(summary);
            
            // Keep last 50 sessions
            const trimmed = sessions.slice(-50);
            localStorage.setItem(this.storageKey + '_sessions', JSON.stringify(trimmed));
            
            console.log('Session saved to PNEU profile');
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    }

    loadProfile() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const profile = JSON.parse(data);
                return profile;
            }
        } catch (e) {
            console.error('Failed to load profile:', e);
        }
        return null;
    }

    loadAllSessions() {
        try {
            const data = localStorage.getItem(this.storageKey + '_sessions');
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load sessions:', e);
        }
        return [];
    }

    // Export data for PNEU system integration
    exportForPNEU() {
        return {
            playerId: this.getOrCreatePlayerId(),
            session: this.getSessionSummary(),
            historicalInsights: this.getInsights(),
            exportTime: new Date().toISOString()
        };
    }

    getOrCreatePlayerId() {
        let playerId = localStorage.getItem(this.storageKey + '_playerId');
        if (!playerId) {
            playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(this.storageKey + '_playerId', playerId);
        }
        return playerId;
    }

    // Simulate sync to PNEU backend (in real implementation, this would be an API call)
    async syncToPNEU() {
        const data = this.exportForPNEU();
        
        // In a real implementation:
        // await fetch('https://api.pneu.com/sync', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });
        
        console.log('PNEU sync data:', data);
        return true;
    }
}

// Session stats display helper
class SessionStatsDisplay {
    constructor(pneuProfile) {
        this.profile = pneuProfile;
    }

    updateEndScreen() {
        const summary = this.profile.getSessionSummary();
        
        // Update duration
        document.getElementById('stat-duration').textContent = summary.durationFormatted;
        
        // Update coherence
        document.getElementById('stat-coherence').textContent = summary.avgCoherence + '%';
        
        // Update stability
        document.getElementById('stat-stability').textContent = summary.avgStability + '%';
        
        // Show PNEU sync status
        const pneuSync = document.getElementById('pneu-sync');
        if (pneuSync) {
            pneuSync.classList.remove('hidden');
        }
    }
}
