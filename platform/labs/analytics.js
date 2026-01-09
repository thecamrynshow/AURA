/**
 * PNEUOMA Labs Analytics - Session Logging & Trend Tracking
 * Tracks user sessions, parameters, and generates insights
 */

class LabsAnalytics {
    constructor(labName = 'resonance') {
        this.labName = labName;
        this.storageKey = `pneuoma-labs-${labName}-sessions`;
        this.currentSession = null;
        this.sessionStartTime = null;
        this.interactions = [];
        this.parameterHistory = [];
        
        this.init();
    }
    
    init() {
        // Load existing sessions
        this.sessions = this.loadSessions();
        
        // Start tracking current session
        this.startSession();
        
        // Save on page unload
        window.addEventListener('beforeunload', () => this.endSession());
        
        // Periodic save every 30 seconds
        setInterval(() => this.saveCurrentSession(), 30000);
    }
    
    // ==================== SESSION MANAGEMENT ====================
    
    loadSessions() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Failed to load sessions:', e);
            return [];
        }
    }
    
    saveSessions() {
        try {
            // Keep only last 100 sessions to avoid storage limits
            const sessionsToSave = this.sessions.slice(-100);
            localStorage.setItem(this.storageKey, JSON.stringify(sessionsToSave));
        } catch (e) {
            console.warn('Failed to save sessions:', e);
        }
    }
    
    startSession() {
        this.sessionStartTime = Date.now();
        this.currentSession = {
            id: `session-${Date.now()}`,
            lab: this.labName,
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            parameters: {},
            parameterChanges: [],
            geometriesUsed: new Set(),
            waveformsUsed: new Set(),
            mediaUsed: new Set(),
            interactionCount: 0,
            peakFrequency: 0,
            avgFrequency: 0,
            frequencyReadings: []
        };
    }
    
    endSession() {
        if (!this.currentSession) return;
        
        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.duration = Math.round((Date.now() - this.sessionStartTime) / 1000);
        
        // Convert Sets to Arrays for JSON storage
        this.currentSession.geometriesUsed = Array.from(this.currentSession.geometriesUsed);
        this.currentSession.waveformsUsed = Array.from(this.currentSession.waveformsUsed);
        this.currentSession.mediaUsed = Array.from(this.currentSession.mediaUsed);
        
        // Calculate average frequency
        if (this.currentSession.frequencyReadings.length > 0) {
            const sum = this.currentSession.frequencyReadings.reduce((a, b) => a + b, 0);
            this.currentSession.avgFrequency = Math.round(sum / this.currentSession.frequencyReadings.length);
        }
        
        // Only save sessions longer than 5 seconds
        if (this.currentSession.duration > 5) {
            this.sessions.push(this.currentSession);
            this.saveSessions();
        }
    }
    
    saveCurrentSession() {
        if (!this.currentSession) return;
        this.currentSession.duration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    }
    
    // ==================== TRACKING ====================
    
    trackParameter(name, value) {
        if (!this.currentSession) return;
        
        this.currentSession.parameters[name] = value;
        this.currentSession.parameterChanges.push({
            time: Date.now() - this.sessionStartTime,
            parameter: name,
            value: value
        });
        
        // Track specific parameters
        if (name === 'geometry') {
            this.currentSession.geometriesUsed.add(value);
        } else if (name === 'waveform') {
            this.currentSession.waveformsUsed.add(value);
        } else if (name === 'medium') {
            this.currentSession.mediaUsed.add(value);
        } else if (name === 'frequency') {
            this.currentSession.frequencyReadings.push(value);
            if (value > this.currentSession.peakFrequency) {
                this.currentSession.peakFrequency = value;
            }
        }
        
        this.currentSession.interactionCount++;
    }
    
    trackInteraction(type, details = {}) {
        if (!this.currentSession) return;
        
        this.currentSession.interactionCount++;
        this.interactions.push({
            time: Date.now() - this.sessionStartTime,
            type: type,
            details: details
        });
    }
    
    // ==================== ANALYTICS ====================
    
    getStats() {
        const allSessions = [...this.sessions];
        
        // Add current session if active
        if (this.currentSession && this.currentSession.duration > 5) {
            const current = { ...this.currentSession };
            current.geometriesUsed = Array.from(current.geometriesUsed);
            current.waveformsUsed = Array.from(current.waveformsUsed);
            current.mediaUsed = Array.from(current.mediaUsed);
            allSessions.push(current);
        }
        
        if (allSessions.length === 0) {
            return this.getEmptyStats();
        }
        
        // Calculate aggregates
        const totalSessions = allSessions.length;
        const totalDuration = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const avgSessionDuration = Math.round(totalDuration / totalSessions);
        
        // Frequency stats
        const allFrequencies = allSessions.flatMap(s => s.frequencyReadings || []);
        const avgFrequency = allFrequencies.length > 0 
            ? Math.round(allFrequencies.reduce((a, b) => a + b, 0) / allFrequencies.length)
            : 440;
        const peakFrequency = Math.max(...allSessions.map(s => s.peakFrequency || 0), 0);
        
        // Most used parameters
        const geometryCounts = this.countOccurrences(allSessions.flatMap(s => s.geometriesUsed || []));
        const waveformCounts = this.countOccurrences(allSessions.flatMap(s => s.waveformsUsed || []));
        const mediaCounts = this.countOccurrences(allSessions.flatMap(s => s.mediaUsed || []));
        
        // Total interactions
        const totalInteractions = allSessions.reduce((sum, s) => sum + (s.interactionCount || 0), 0);
        
        // Sessions per day (last 30 days)
        const sessionsPerDay = this.getSessionsPerDay(allSessions, 30);
        
        // Duration trend (last 10 sessions)
        const durationTrend = allSessions.slice(-10).map(s => ({
            date: s.startTime,
            duration: s.duration || 0
        }));
        
        // Frequency exploration over time
        const frequencyTrend = allSessions.slice(-10).map(s => ({
            date: s.startTime,
            avg: s.avgFrequency || 440,
            peak: s.peakFrequency || 440
        }));
        
        return {
            summary: {
                totalSessions,
                totalDuration,
                avgSessionDuration,
                totalInteractions,
                avgFrequency,
                peakFrequency
            },
            favorites: {
                geometry: this.getMostCommon(geometryCounts) || '1d',
                waveform: this.getMostCommon(waveformCounts) || 'sine',
                medium: this.getMostCommon(mediaCounts) || 'water'
            },
            distributions: {
                geometries: geometryCounts,
                waveforms: waveformCounts,
                media: mediaCounts
            },
            trends: {
                sessionsPerDay,
                durationTrend,
                frequencyTrend
            },
            recentSessions: allSessions.slice(-5).reverse()
        };
    }
    
    getEmptyStats() {
        return {
            summary: {
                totalSessions: 0,
                totalDuration: 0,
                avgSessionDuration: 0,
                totalInteractions: 0,
                avgFrequency: 440,
                peakFrequency: 440
            },
            favorites: {
                geometry: '1d',
                waveform: 'sine',
                medium: 'water'
            },
            distributions: {
                geometries: {},
                waveforms: {},
                media: {}
            },
            trends: {
                sessionsPerDay: [],
                durationTrend: [],
                frequencyTrend: []
            },
            recentSessions: []
        };
    }
    
    countOccurrences(arr) {
        return arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
    }
    
    getMostCommon(counts) {
        const entries = Object.entries(counts);
        if (entries.length === 0) return null;
        return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
    
    getSessionsPerDay(sessions, days) {
        const result = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const count = sessions.filter(s => {
                const sessionDate = new Date(s.startTime).toISOString().split('T')[0];
                return sessionDate === dateStr;
            }).length;
            
            result.push({
                date: dateStr,
                count: count
            });
        }
        
        return result;
    }
    
    // ==================== DATA EXPORT ====================
    
    exportData() {
        const stats = this.getStats();
        const data = {
            exported: new Date().toISOString(),
            lab: this.labName,
            stats: stats,
            sessions: this.sessions
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pneuoma-labs-${this.labName}-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    clearData() {
        if (confirm('Are you sure you want to clear all session data? This cannot be undone.')) {
            this.sessions = [];
            localStorage.removeItem(this.storageKey);
            this.startSession();
            return true;
        }
        return false;
    }
}

/**
 * Analytics Dashboard UI Component
 */
class AnalyticsDashboard {
    constructor(analytics, containerId) {
        this.analytics = analytics;
        this.container = document.getElementById(containerId);
        this.isVisible = false;
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.render();
        } else {
            this.hide();
        }
    }
    
    show() {
        this.isVisible = true;
        this.render();
    }
    
    hide() {
        this.isVisible = false;
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.add('hidden');
        }
    }
    
    render() {
        if (!this.container) return;
        
        const stats = this.analytics.getStats();
        this.container.classList.remove('hidden');
        
        this.container.innerHTML = `
            <div class="analytics-panel">
                <div class="analytics-header">
                    <h3>📊 Session Analytics</h3>
                    <button class="analytics-close" id="analytics-close">&times;</button>
                </div>
                
                <div class="analytics-content">
                    <!-- Summary Stats -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-value">${stats.summary.totalSessions}</span>
                            <span class="stat-label">Total Sessions</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${this.formatDuration(stats.summary.totalDuration)}</span>
                            <span class="stat-label">Total Time</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${this.formatDuration(stats.summary.avgSessionDuration)}</span>
                            <span class="stat-label">Avg Session</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${stats.summary.totalInteractions}</span>
                            <span class="stat-label">Interactions</span>
                        </div>
                    </div>
                    
                    <!-- Frequency Stats -->
                    <div class="frequency-stats">
                        <h4>Frequency Exploration</h4>
                        <div class="freq-stat-row">
                            <div class="freq-stat">
                                <span class="freq-stat-value">${stats.summary.avgFrequency} Hz</span>
                                <span class="freq-stat-label">Average</span>
                            </div>
                            <div class="freq-stat">
                                <span class="freq-stat-value">${stats.summary.peakFrequency} Hz</span>
                                <span class="freq-stat-label">Peak</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Favorites -->
                    <div class="favorites-section">
                        <h4>Most Used</h4>
                        <div class="favorites-grid">
                            <div class="favorite-item">
                                <span class="favorite-icon">${this.getGeometryIcon(stats.favorites.geometry)}</span>
                                <span class="favorite-label">${this.formatGeometry(stats.favorites.geometry)}</span>
                            </div>
                            <div class="favorite-item">
                                <span class="favorite-icon">${this.getWaveformIcon(stats.favorites.waveform)}</span>
                                <span class="favorite-label">${this.capitalize(stats.favorites.waveform)}</span>
                            </div>
                            <div class="favorite-item">
                                <span class="favorite-icon">${this.getMediumIcon(stats.favorites.medium)}</span>
                                <span class="favorite-label">${this.capitalize(stats.favorites.medium)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Trend Charts -->
                    <div class="charts-section">
                        <h4>Activity Trend (Last 7 Days)</h4>
                        <canvas id="activity-chart" width="300" height="100"></canvas>
                    </div>
                    
                    <div class="charts-section">
                        <h4>Session Duration Trend</h4>
                        <canvas id="duration-chart" width="300" height="100"></canvas>
                    </div>
                    
                    <!-- Distribution Charts -->
                    <div class="distribution-section">
                        <h4>Parameter Distribution</h4>
                        <div class="distribution-bars">
                            ${this.renderDistributionBars('Geometry', stats.distributions.geometries, this.getGeometryIcon.bind(this))}
                            ${this.renderDistributionBars('Waveform', stats.distributions.waveforms, this.getWaveformIcon.bind(this))}
                        </div>
                    </div>
                    
                    <!-- Recent Sessions -->
                    <div class="recent-section">
                        <h4>Recent Sessions</h4>
                        <div class="recent-sessions">
                            ${stats.recentSessions.length > 0 
                                ? stats.recentSessions.map(s => this.renderSessionItem(s)).join('')
                                : '<p class="no-data">No sessions yet. Start exploring!</p>'
                            }
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="analytics-actions">
                        <button class="analytics-btn" id="export-data">
                            <span>📥 Export Data</span>
                        </button>
                        <button class="analytics-btn danger" id="clear-data">
                            <span>🗑️ Clear Data</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Draw charts
        setTimeout(() => {
            this.drawActivityChart(stats.trends.sessionsPerDay.slice(-7));
            this.drawDurationChart(stats.trends.durationTrend);
        }, 100);
        
        // Event listeners
        document.getElementById('analytics-close').addEventListener('click', () => this.hide());
        document.getElementById('export-data').addEventListener('click', () => this.analytics.exportData());
        document.getElementById('clear-data').addEventListener('click', () => {
            if (this.analytics.clearData()) {
                this.render();
            }
        });
    }
    
    // ==================== CHART RENDERING ====================
    
    drawActivityChart(data) {
        const canvas = document.getElementById('activity-chart');
        if (!canvas || data.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 25;
        
        ctx.clearRect(0, 0, width, height);
        
        const maxCount = Math.max(...data.map(d => d.count), 1);
        const barWidth = (width - padding * 2) / data.length - 4;
        
        // Draw bars
        data.forEach((d, i) => {
            const barHeight = (d.count / maxCount) * (height - padding * 2);
            const x = padding + i * (barWidth + 4);
            const y = height - padding - barHeight;
            
            // Bar gradient
            const gradient = ctx.createLinearGradient(x, y, x, height - padding);
            gradient.addColorStop(0, '#00fff2');
            gradient.addColorStop(1, '#0ea5e9');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Day label
            ctx.fillStyle = '#6b7280';
            ctx.font = '9px Space Grotesk';
            ctx.textAlign = 'center';
            const dayLabel = new Date(d.date).toLocaleDateString('en', { weekday: 'short' });
            ctx.fillText(dayLabel, x + barWidth / 2, height - 5);
            
            // Count label
            if (d.count > 0) {
                ctx.fillStyle = '#e5e7eb';
                ctx.fillText(d.count, x + barWidth / 2, y - 5);
            }
        });
    }
    
    drawDurationChart(data) {
        const canvas = document.getElementById('duration-chart');
        if (!canvas || data.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 25;
        
        ctx.clearRect(0, 0, width, height);
        
        const maxDuration = Math.max(...data.map(d => d.duration), 60);
        const pointSpacing = (width - padding * 2) / Math.max(data.length - 1, 1);
        
        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        
        data.forEach((d, i) => {
            const x = padding + i * pointSpacing;
            const y = height - padding - (d.duration / maxDuration) * (height - padding * 2);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw points
        data.forEach((d, i) => {
            const x = padding + i * pointSpacing;
            const y = height - padding - (d.duration / maxDuration) * (height - padding * 2);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#a855f7';
            ctx.fill();
            
            // Duration label
            ctx.fillStyle = '#9ca3af';
            ctx.font = '9px Space Grotesk';
            ctx.textAlign = 'center';
            ctx.fillText(this.formatDuration(d.duration), x, y - 10);
        });
        
        // Y-axis label
        ctx.fillStyle = '#6b7280';
        ctx.font = '9px Space Grotesk';
        ctx.textAlign = 'left';
        ctx.fillText('Duration', 5, 15);
    }
    
    // ==================== HELPERS ====================
    
    renderDistributionBars(label, data, iconFn) {
        const entries = Object.entries(data);
        if (entries.length === 0) return '';
        
        const total = entries.reduce((sum, [_, count]) => sum + count, 0);
        
        return `
            <div class="distribution-group">
                <span class="distribution-label">${label}</span>
                <div class="distribution-bar-container">
                    ${entries.map(([key, count]) => {
                        const percent = Math.round((count / total) * 100);
                        return `
                            <div class="distribution-segment" style="width: ${percent}%" title="${key}: ${percent}%">
                                <span class="segment-icon">${iconFn(key)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    renderSessionItem(session) {
        const date = new Date(session.startTime);
        const dateStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="session-item">
                <div class="session-time">
                    <span class="session-date">${dateStr}</span>
                    <span class="session-hour">${timeStr}</span>
                </div>
                <div class="session-details">
                    <span class="session-duration">${this.formatDuration(session.duration)}</span>
                    <span class="session-interactions">${session.interactionCount} interactions</span>
                </div>
            </div>
        `;
    }
    
    formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    }
    
    formatGeometry(geo) {
        const names = { '1d': '1D Tube', '2d': '2D Plate', '3d': '3D Sphere', '4d': '4D Hyper' };
        return names[geo] || geo;
    }
    
    getGeometryIcon(geo) {
        const icons = { '1d': '―', '2d': '◯', '3d': '◉', '4d': '✧' };
        return icons[geo] || '?';
    }
    
    getWaveformIcon(wave) {
        const icons = { 'sine': '∿', 'square': '⊓', 'triangle': '△', 'sawtooth': '⩘' };
        return icons[wave] || '?';
    }
    
    getMediumIcon(medium) {
        const icons = { 'water': '💧', 'tissue': '🫀', 'air': '💨', 'bone': '🦴' };
        return icons[medium] || '?';
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Export for use in other modules
window.LabsAnalytics = LabsAnalytics;
window.AnalyticsDashboard = AnalyticsDashboard;

