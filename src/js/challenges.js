/**
 * Project AURA - Challenge System
 * Three regulation-based challenges
 */

class ChallengeManager {
    constructor(game) {
        this.game = game;
        this.activeChallenge = null;
        this.completedChallenges = new Set();
        
        // Challenge definitions
        this.challenges = {
            windCrossing: new WindCrossingChallenge(this),
            crystalGrove: new CrystalGroveChallenge(this),
            lightAnimal: new LightAnimalChallenge(this)
        };
        
        // UI elements
        this.overlay = document.getElementById('challenge-overlay');
        this.content = document.getElementById('challenge-content');
    }

    update(deltaTime, breathState, playerPos) {
        if (this.activeChallenge) {
            this.activeChallenge.update(deltaTime, breathState, playerPos);
        }
    }

    render(ctx, camera) {
        if (this.activeChallenge) {
            this.activeChallenge.render(ctx, camera);
        }
    }

    startChallenge(challengeId) {
        if (this.activeChallenge) return;
        if (this.completedChallenges.has(challengeId)) return;
        
        const challenge = this.challenges[challengeId];
        if (challenge) {
            this.activeChallenge = challenge;
            challenge.start();
            
            // Show breath guide
            this.game.breathGuide.show('calming');
        }
    }

    completeChallenge(challengeId) {
        this.completedChallenges.add(challengeId);
        this.activeChallenge = null;
        
        // Hide breath guide
        this.game.breathGuide.hide();
        
        // Play success sound
        this.game.audio.playSuccessChime();
        
        // Show completion message
        this.showMessage('Challenge Complete!', 2000);
        
        // Check if all challenges complete
        if (this.completedChallenges.size >= 3) {
            setTimeout(() => {
                this.game.endSession();
            }, 3000);
        }
    }

    failChallenge(challengeId) {
        this.activeChallenge = null;
        this.game.breathGuide.hide();
        this.showMessage('Try again when you\'re ready...', 2000);
    }

    showOverlay(html) {
        this.content.innerHTML = html;
        this.overlay.classList.remove('hidden');
    }

    hideOverlay() {
        this.overlay.classList.add('hidden');
    }

    showMessage(text, duration = 3000) {
        const msgEl = document.getElementById('message-display');
        const textEl = document.getElementById('message-text');
        
        textEl.textContent = text;
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
        }, duration);
    }
}

// ============================================
// Challenge 1: The Wind Crossing
// ============================================
class WindCrossingChallenge {
    constructor(manager) {
        this.manager = manager;
        this.id = 'windCrossing';
        
        // Bridge state
        this.bridgeProgress = 0;
        this.bridgeSolidity = 0;
        this.windIntensity = 0;
        
        // Visual elements
        this.particles = [];
        this.bridgeX = 800;
        this.bridgeY = 600;
        this.bridgeWidth = 200;
        
        // Challenge state
        this.active = false;
        this.phase = 'intro'; // intro, crossing, complete
        this.steadyTime = 0;
        this.requiredSteadyTime = 5000; // 5 seconds of calm breathing
        
        // Wind sound
        this.windSound = null;
    }

    start() {
        this.active = true;
        this.phase = 'intro';
        this.bridgeProgress = 0;
        this.bridgeSolidity = 0;
        this.steadyTime = 0;
        
        // Show intro
        this.manager.showOverlay(`
            <h2 class="challenge-title">The Wind Crossing</h2>
            <p class="challenge-description">
                A floating bridge awaits.<br>
                Strong wind pushes against you.<br><br>
                <em>Slow your breathing to steady the bridge.</em>
            </p>
            <div class="wind-bridge"></div>
            <div class="challenge-progress">
                <div class="challenge-progress-fill" id="wind-progress"></div>
            </div>
        `);
        
        // Start wind sound
        this.windSound = this.manager.game.audio.playWindSound(0.5);
        
        setTimeout(() => {
            this.phase = 'crossing';
        }, 2000);
    }

    update(deltaTime, breathState, playerPos) {
        if (!this.active) return;
        
        const coherence = (breathState.coherence || 50) / 100;
        const stability = (breathState.stability || 50) / 100;
        const isCalm = coherence > 0.5 && stability > 0.5;
        
        // Update wind intensity (inverse of calm)
        this.windIntensity = Utils.lerp(this.windIntensity, 1 - coherence, 0.05);
        
        if (this.windSound) {
            this.windSound.setIntensity(this.windIntensity);
        }
        
        if (this.phase === 'crossing') {
            if (isCalm) {
                // Steady breathing - bridge solidifies
                this.steadyTime += deltaTime;
                this.bridgeSolidity = Utils.lerp(this.bridgeSolidity, 1, 0.02);
                this.bridgeProgress = this.steadyTime / this.requiredSteadyTime;
            } else {
                // Chaotic breathing - bridge dissolves
                this.steadyTime = Math.max(0, this.steadyTime - deltaTime * 0.5);
                this.bridgeSolidity = Utils.lerp(this.bridgeSolidity, 0.2, 0.03);
                this.bridgeProgress = this.steadyTime / this.requiredSteadyTime;
            }
            
            // Update progress bar
            const progressEl = document.getElementById('wind-progress');
            if (progressEl) {
                progressEl.style.width = `${this.bridgeProgress * 100}%`;
            }
            
            // Update bridge visual
            const bridgeEl = document.querySelector('.wind-bridge');
            if (bridgeEl) {
                if (this.bridgeSolidity > 0.8) {
                    bridgeEl.className = 'wind-bridge solid';
                } else if (this.bridgeSolidity > 0.4) {
                    bridgeEl.className = 'wind-bridge forming';
                } else {
                    bridgeEl.className = 'wind-bridge';
                }
            }
            
            // Check completion
            if (this.bridgeProgress >= 1) {
                this.complete();
            }
        }
        
        // Update wind particles
        this.updateParticles(deltaTime);
    }

    updateParticles(deltaTime) {
        // Spawn wind particles
        if (Math.random() < this.windIntensity * 0.3) {
            this.particles.push({
                x: this.bridgeX - 150,
                y: this.bridgeY + Utils.random(-50, 50),
                vx: 2 + this.windIntensity * 3,
                vy: Utils.random(-0.5, 0.5),
                size: Utils.random(2, 4),
                alpha: 0.5
            });
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy + Math.sin(p.x * 0.05) * 0.5;
            p.alpha -= 0.01;
            return p.alpha > 0 && p.x < this.bridgeX + 200;
        });
    }

    render(ctx, camera) {
        if (!this.active) return;
        
        // Draw wind particles
        this.particles.forEach(p => {
            const sx = p.x - camera.x;
            const sy = p.y - camera.y;
            
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx - p.vx * 3, sy);
            ctx.strokeStyle = `rgba(200, 220, 255, ${p.alpha})`;
            ctx.lineWidth = p.size;
            ctx.lineCap = 'round';
            ctx.stroke();
        });
        
        // Draw bridge
        const bx = this.bridgeX - camera.x;
        const by = this.bridgeY - camera.y;
        
        // Bridge glow
        const glowAlpha = this.bridgeSolidity * 0.5;
        ctx.beginPath();
        ctx.ellipse(bx, by, this.bridgeWidth / 2, 20, 0, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, this.bridgeWidth / 2);
        gradient.addColorStop(0, `rgba(100, 255, 218, ${glowAlpha})`);
        gradient.addColorStop(1, `rgba(100, 255, 218, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    complete() {
        this.phase = 'complete';
        this.active = false;
        
        if (this.windSound) {
            this.windSound.stop();
        }
        
        this.manager.hideOverlay();
        this.manager.completeChallenge(this.id);
    }
}

// ============================================
// Challenge 2: The Crystal Grove
// ============================================
class CrystalGroveChallenge {
    constructor(manager) {
        this.manager = manager;
        this.id = 'crystalGrove';
        
        // Crystals
        this.crystals = [];
        this.numCrystals = 5;
        this.syncedCrystals = 0;
        
        // State
        this.active = false;
        this.phase = 'intro';
        this.pulsePhase = 0;
        this.targetPulse = 0;
        
        // Position
        this.centerX = 1800;
        this.centerY = 800;
    }

    start() {
        this.active = true;
        this.phase = 'intro';
        this.syncedCrystals = 0;
        
        // Initialize crystals
        this.crystals = [];
        for (let i = 0; i < this.numCrystals; i++) {
            const angle = (i / this.numCrystals) * Math.PI * 2;
            this.crystals.push({
                x: this.centerX + Math.cos(angle) * 80,
                y: this.centerY + Math.sin(angle) * 80,
                synced: false,
                pulseOffset: Utils.random(0, Math.PI * 2),
                hue: 240 + i * 20
            });
        }
        
        // Show intro
        this.manager.showOverlay(`
            <h2 class="challenge-title">The Crystal Grove</h2>
            <p class="challenge-description">
                Crystals hum out of sync.<br>
                Restore harmony by steadying your breath<br>
                and tapping each crystal in rhythm.<br><br>
                <em>Breathe slowly. Listen deeply.</em>
            </p>
            <div class="crystal-container" id="crystal-display">
                ${this.crystals.map((c, i) => 
                    `<div class="crystal" data-index="${i}"></div>`
                ).join('')}
            </div>
            <div class="challenge-progress">
                <div class="challenge-progress-fill" id="crystal-progress"></div>
            </div>
        `);
        
        // Add click handlers
        setTimeout(() => {
            document.querySelectorAll('.crystal').forEach(el => {
                el.addEventListener('click', () => {
                    const index = parseInt(el.dataset.index);
                    this.tapCrystal(index);
                });
            });
            this.phase = 'playing';
        }, 2000);
    }

    tapCrystal(index) {
        if (this.phase !== 'playing') return;
        if (this.crystals[index].synced) return;
        
        const breathState = this.manager.game.breathDetector;
        const coherence = (breathState.coherence || 50) / 100;
        
        // Crystal syncs if player is breathing steadily
        if (coherence > 0.4) {
            this.crystals[index].synced = true;
            this.syncedCrystals++;
            
            // Play crystal sound
            this.manager.game.audio.playCrystalTone(index, true);
            
            // Update visual
            const crystalEl = document.querySelector(`.crystal[data-index="${index}"]`);
            if (crystalEl) {
                crystalEl.classList.add('synced');
            }
            
            // Update progress
            const progressEl = document.getElementById('crystal-progress');
            if (progressEl) {
                progressEl.style.width = `${(this.syncedCrystals / this.numCrystals) * 100}%`;
            }
            
            // Check completion
            if (this.syncedCrystals >= this.numCrystals) {
                setTimeout(() => this.complete(), 1000);
            }
        } else {
            // Not calm enough - crystal pulses red briefly
            this.manager.game.audio.playCrystalTone(index, false);
            
            const crystalEl = document.querySelector(`.crystal[data-index="${index}"]`);
            if (crystalEl) {
                crystalEl.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #cc4444 100%)';
                setTimeout(() => {
                    crystalEl.style.background = '';
                }, 300);
            }
        }
    }

    update(deltaTime, breathState, playerPos) {
        if (!this.active) return;
        
        this.pulsePhase += deltaTime * 0.002;
        
        // Update crystal visuals based on breath
        const coherence = (breathState.coherence || 50) / 100;
        
        document.querySelectorAll('.crystal').forEach((el, i) => {
            if (!this.crystals[i].synced) {
                const pulse = Math.sin(this.pulsePhase * 2 + this.crystals[i].pulseOffset);
                const active = pulse > 0.5 && coherence > 0.3;
                el.classList.toggle('active', active);
            }
        });
    }

    render(ctx, camera) {
        if (!this.active) return;
        
        // Draw crystal positions in world
        this.crystals.forEach((crystal, i) => {
            const sx = crystal.x - camera.x;
            const sy = crystal.y - camera.y;
            
            const pulse = Math.sin(this.pulsePhase * 2 + crystal.pulseOffset) * 0.3 + 0.7;
            const size = 15 * pulse;
            
            // Glow
            const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 3);
            const alpha = crystal.synced ? 0.6 : 0.3;
            const hue = crystal.synced ? 160 : crystal.hue;
            
            gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, ${alpha})`);
            gradient.addColorStop(1, `hsla(${hue}, 70%, 60%, 0)`);
            
            ctx.beginPath();
            ctx.arc(sx, sy, size * 3, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Core
            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
            ctx.fill();
        });
    }

    complete() {
        this.phase = 'complete';
        this.active = false;
        this.manager.hideOverlay();
        this.manager.completeChallenge(this.id);
    }
}

// ============================================
// Challenge 3: The Light Animal
// ============================================
class LightAnimalChallenge {
    constructor(manager) {
        this.manager = manager;
        this.id = 'lightAnimal';
        
        // Animal state
        this.distance = 1; // 1 = far, 0 = close
        this.trust = 0;
        this.state = 'distant'; // distant, curious, approaching, close
        
        // Position
        this.centerX = 2400;
        this.centerY = 500;
        this.animalX = this.centerX + 150;
        this.animalY = this.centerY;
        
        // Animation
        this.bobPhase = 0;
        this.glowPhase = 0;
        
        // Stillness tracking
        this.stillTime = 0;
        this.calmTime = 0;
        this.requiredTime = 8000; // 8 seconds
        
        this.active = false;
        this.phase = 'intro';
    }

    start() {
        this.active = true;
        this.phase = 'intro';
        this.distance = 1;
        this.trust = 0;
        this.stillTime = 0;
        this.calmTime = 0;
        this.state = 'distant';
        
        // Show intro
        this.manager.showOverlay(`
            <h2 class="challenge-title">The Light Animal</h2>
            <p class="challenge-description">
                A glowing creature appears, frightened.<br><br>
                Sit still. Breathe slowly.<br>
                Emit calming presence.<br><br>
                <em>The creature approaches only when your nervous system stabilizes.</em>
            </p>
            <div class="light-animal distant" id="light-animal-display"></div>
            <div class="challenge-progress">
                <div class="challenge-progress-fill" id="animal-progress"></div>
            </div>
        `);
        
        setTimeout(() => {
            this.phase = 'approaching';
        }, 2000);
    }

    update(deltaTime, breathState, playerPos) {
        if (!this.active || this.phase === 'intro') return;
        
        const coherence = (breathState.coherence || 50) / 100;
        const stability = (breathState.stability || 50) / 100;
        const player = this.manager.game.player;
        const isStill = player.isStill();
        const isCalm = coherence > 0.5 && stability > 0.5;
        
        // Both stillness and calm breathing required
        if (isStill && isCalm) {
            this.calmTime += deltaTime;
            this.trust = Utils.lerp(this.trust, 1, 0.005);
            this.distance = Math.max(0, 1 - (this.calmTime / this.requiredTime));
            
            // Play approach sound occasionally
            if (Math.random() < 0.01) {
                this.manager.game.audio.playAnimalApproach(this.distance);
            }
        } else {
            // Reset if player moves or breathing becomes chaotic
            if (!isStill) {
                this.trust = Utils.lerp(this.trust, 0, 0.02);
                this.calmTime = Math.max(0, this.calmTime - deltaTime * 0.3);
                this.distance = Math.max(0.3, 1 - (this.calmTime / this.requiredTime));
            } else {
                // Still but not calm - slow progress loss
                this.calmTime = Math.max(0, this.calmTime - deltaTime * 0.1);
                this.distance = Math.max(0.2, 1 - (this.calmTime / this.requiredTime));
            }
        }
        
        // Update state
        if (this.distance > 0.7) {
            this.state = 'distant';
        } else if (this.distance > 0.4) {
            this.state = 'curious';
        } else if (this.distance > 0.1) {
            this.state = 'approaching';
        } else {
            this.state = 'close';
        }
        
        // Update progress bar
        const progressEl = document.getElementById('animal-progress');
        if (progressEl) {
            progressEl.style.width = `${(1 - this.distance) * 100}%`;
        }
        
        // Update animal visual
        const animalEl = document.getElementById('light-animal-display');
        if (animalEl) {
            animalEl.className = `light-animal ${this.state}`;
        }
        
        // Update animal position
        this.animalX = this.centerX + this.distance * 150;
        
        // Animation
        this.bobPhase += deltaTime * 0.002;
        this.glowPhase += deltaTime * 0.003;
        
        // Check completion
        if (this.distance <= 0.05) {
            this.complete();
        }
    }

    render(ctx, camera) {
        if (!this.active) return;
        
        const bob = Math.sin(this.bobPhase * 2) * 5;
        const sx = this.animalX - camera.x;
        const sy = this.animalY - camera.y + bob;
        
        const size = 25 * (1 - this.distance * 0.5);
        const glowSize = size * (2 + Math.sin(this.glowPhase) * 0.3);
        
        // Outer glow
        const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowSize * 2);
        gradient.addColorStop(0, `rgba(255, 215, 0, ${0.3 * (1 - this.distance)})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.1 * (1 - this.distance)})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(sx, sy, glowSize * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Core glow
        const coreGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, size);
        coreGradient.addColorStop(0, 'rgba(255, 255, 220, 0.9)');
        coreGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.7)');
        coreGradient.addColorStop(1, 'rgba(255, 180, 0, 0.5)');
        
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
        
        // Eyes (when close enough)
        if (this.distance < 0.5) {
            const eyeAlpha = (0.5 - this.distance) * 2;
            ctx.beginPath();
            ctx.arc(sx - size * 0.3, sy - size * 0.1, size * 0.15, 0, Math.PI * 2);
            ctx.arc(sx + size * 0.3, sy - size * 0.1, size * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(50, 50, 50, ${eyeAlpha})`;
            ctx.fill();
        }
    }

    complete() {
        this.phase = 'complete';
        this.active = false;
        this.manager.hideOverlay();
        this.manager.completeChallenge(this.id);
    }
}
