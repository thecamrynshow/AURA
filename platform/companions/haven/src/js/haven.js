/**
 * Haven - AI Companion for Trauma Survivors
 * PNEUMA Companions
 * 
 * Gentle, trauma-informed support for abuse survivors, grief,
 * loss, and all forms of trauma. Emphasizes safety and choice.
 * NOT a replacement for professional trauma therapy.
 */

class Haven {
    constructor() {
        this.conversationHistory = [];
        this.isTyping = false;
        this.apiUrl = this.detectApiUrl();
        this.useApi = true;
        this.breathingInterval = null;
        
        // Trauma-informed responses
        this.responses = {
            // Abuse
            abuse: [
                {
                    messages: [
                        "Thank you for trusting me with that. What happened to you was not okay, and it was not your fault. 🕊️",
                        "Surviving abuse takes incredible strength — strength you may not even realize you have.",
                    ],
                    affirmation: "You are not what happened to you. You are who you choose to become. 🕊️",
                    tool: {
                        title: "🌿 Healing from Abuse",
                        content: `
                            <p><strong>Know this:</strong></p>
                            <ul>
                                <li>It was not your fault. Nothing you did caused it.</li>
                                <li>Your feelings — anger, shame, grief — are all valid.</li>
                                <li>Healing isn't linear. Bad days don't erase progress.</li>
                                <li>You deserved protection. You deserve kindness now.</li>
                            </ul>
                            <p style="margin-top: 12px;">If you're still in danger, please reach out: <strong>1-800-799-7233</strong> (National Domestic Violence Hotline)</p>
                        `
                    },
                    followUp: "Would you like to talk more about what you're feeling, or would you prefer some coping tools?"
                }
            ],
            
            // Grief
            grief: [
                {
                    messages: [
                        "I'm so sorry for your loss. Grief is love with nowhere to go, and it hurts deeply. 🕊️",
                        "There's no right way to grieve. Whatever you're feeling — sadness, anger, numbness, guilt — it's all part of loving someone.",
                    ],
                    affirmation: "Grief is proof of love. Take all the time you need. 🕊️",
                    tool: {
                        title: "🕯️ Moving Through Grief",
                        content: `
                            <p><strong>Grief is not linear:</strong></p>
                            <ul>
                                <li>You may feel fine one moment and devastated the next</li>
                                <li>Anger, guilt, and bargaining are normal</li>
                                <li>The waves of grief get smaller over time, but they never fully stop</li>
                                <li>Continuing bonds — talking to them, honoring them — is healthy</li>
                            </ul>
                            <p style="margin-top: 12px;"><strong>Be gentle with yourself:</strong> Cancel what you can. Ask for help. Rest.</p>
                        `
                    },
                    followUp: "Would you like to tell me about them? Sometimes sharing memories helps."
                }
            ],
            
            // Trauma
            trauma: [
                {
                    messages: [
                        "I'm here with you. Whatever happened — I believe you. 🕊️",
                        "Trauma changes us, but it doesn't have to define us. You're not broken; you're adapting to something that should never have happened.",
                    ],
                    tool: {
                        title: "🌧️ Understanding Trauma",
                        content: `
                            <p><strong>Trauma responses are normal:</strong></p>
                            <ul>
                                <li><strong>Flashbacks:</strong> Your brain trying to process what happened</li>
                                <li><strong>Hypervigilance:</strong> Your body trying to keep you safe</li>
                                <li><strong>Numbness:</strong> Your mind protecting you from overwhelm</li>
                                <li><strong>Nightmares:</strong> Your brain processing while you sleep</li>
                            </ul>
                            <p style="margin-top: 12px;">These responses kept you alive. Now we can work on helping your nervous system feel safe again.</p>
                        `
                    },
                    followUp: "Are you in a safe place right now? Let's make sure you feel grounded."
                }
            ],
            
            // Feeling unsafe
            unsafe: [
                {
                    messages: [
                        "I hear you. When trauma lives in our body, feeling safe can be so hard. 🕊️",
                        "Right now, let's focus on this moment. You are here. You are reading these words. You are safe right now.",
                    ],
                    tool: {
                        title: "🫂 Body Safety",
                        content: `
                            <p><strong>Grounding in your body:</strong></p>
                            <ul>
                                <li>Feel your feet on the floor. Press down. You are here.</li>
                                <li>Notice where your body touches the chair or bed.</li>
                                <li>Put a hand on your chest. Feel your heartbeat.</li>
                                <li>Take a slow breath. You are breathing. You are alive. You are safe.</li>
                            </ul>
                            <p style="margin-top: 12px;"><strong>Your body kept you alive.</strong> It's not the enemy — it's trying to protect you.</p>
                        `
                    },
                    followUp: "Would you like to try a grounding exercise together? I can guide you through one."
                }
            ],
            
            // Coping tools
            coping: [
                {
                    messages: [
                        "I'm glad you're reaching out for tools. That's a powerful act of self-care. 🕊️",
                    ],
                    tool: {
                        title: "🌿 Coping Toolkit",
                        content: `
                            <p><strong>In the moment:</strong></p>
                            <ul>
                                <li><strong>5-4-3-2-1:</strong> Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste</li>
                                <li><strong>Cold water:</strong> Splash your face or hold ice cubes</li>
                                <li><strong>Box breathing:</strong> In 4, hold 4, out 4, hold 4</li>
                                <li><strong>Movement:</strong> Walk, stretch, shake your hands</li>
                            </ul>
                            <p style="margin-top: 12px;"><strong>Daily practices:</strong></p>
                            <ul>
                                <li>Journaling (even 5 minutes)</li>
                                <li>Gentle movement (yoga, walking)</li>
                                <li>Connecting with safe people</li>
                                <li>Limiting news/social media when overwhelmed</li>
                            </ul>
                        `
                    },
                    followUp: "Would you like to try the 5-4-3-2-1 grounding exercise right now?"
                }
            ],
            
            // Just be present
            presence: [
                {
                    messages: [
                        "I'm here. 🕊️",
                        "You don't have to say anything. You don't have to explain. We can just sit here together.",
                        "Sometimes the bravest thing is just making it through another moment. I see you. I'm with you."
                    ],
                    affirmation: "You are not alone. Even in the darkest moments, there is light somewhere — and you will find it. 🕊️"
                }
            ],
            
            // Flashback/dissociation
            flashback: [
                {
                    messages: [
                        "I'm here with you right now. Let's ground together. 🕊️",
                        "Look around the room. Name something you see. You are HERE, not THERE. The past is not happening now.",
                    ],
                    tool: {
                        title: "🌍 Come Back to Now",
                        content: `
                            <p><strong>You are safe. You are here.</strong></p>
                            <ul>
                                <li>Press your feet into the floor. Feel that.</li>
                                <li>Look at your hands. They are YOUR hands, in THIS moment.</li>
                                <li>Say out loud: "My name is ___. I am in ___. It is [year]."</li>
                                <li>Touch something — a texture, temperature. Focus on that sensation.</li>
                            </ul>
                            <p style="margin-top: 12px;">What happened is NOT happening now. You survived then. You are safe now.</p>
                        `
                    },
                    followUp: "Take your time. I'm not going anywhere. How are you feeling now?"
                }
            ],
            
            // Nightmares/sleep
            nightmares: [
                {
                    messages: [
                        "Nightmares are exhausting. When sleep doesn't feel safe, everything becomes harder. 🕊️",
                        "Your brain is trying to process what happened, even while you sleep. It's not a sign of weakness.",
                    ],
                    tool: {
                        title: "🌙 Sleep & Nightmares",
                        content: `
                            <p><strong>Before bed:</strong></p>
                            <ul>
                                <li>Create a calming routine (same time, same ritual)</li>
                                <li>Keep something grounding by your bed (a texture, a photo)</li>
                                <li>Write down worries to "put them away" for the night</li>
                            </ul>
                            <p style="margin-top: 12px;"><strong>After a nightmare:</strong></p>
                            <ul>
                                <li>Turn on a light. Say where you are out loud.</li>
                                <li>Touch something cold. Get water.</li>
                                <li>Remind yourself: "That was a dream. I am safe now."</li>
                                <li>Try imagery rescripting: rewrite the ending in your mind</li>
                            </ul>
                        `
                    },
                    followUp: "Are nightmares happening often? Sometimes a trauma-specialized therapist can help with specific techniques like EMDR or IRT."
                }
            ],
            
            // Shame
            shame: [
                {
                    messages: [
                        "Shame is such a heavy weight to carry. It whispers that you are bad, broken, unworthy. That's a lie. 🕊️",
                        "Whatever you're feeling shame about — it doesn't define your worth. You are more than any single moment, any single choice, any single thing that happened to you.",
                    ],
                    affirmation: "You are worthy of love and kindness — especially from yourself. 🕊️",
                    followUp: "What would you say to a friend who was carrying what you're carrying? Can you offer yourself that same compassion?"
                }
            ],
            
            // Positive
            positive: [
                {
                    messages: [
                        "I'm glad something helped. 🕊️",
                        "Healing happens in small moments. This is one of them.",
                        "Thank you for being here, for trying, for not giving up on yourself."
                    ]
                }
            ],
            
            // Default
            default: [
                {
                    messages: [
                        "Thank you for sharing that with me. I'm here. 🕊️",
                        "Take your time. There's no pressure to say more than feels safe."
                    ],
                    followUp: "What would feel most helpful right now — talking, or some coping tools?"
                }
            ],
            
            // Crisis
            crisis: [
                {
                    messages: [
                        "I'm really glad you told me. What you're feeling sounds overwhelming right now. 🕊️",
                        "You reached out — that took courage. Please keep reaching out.",
                        "I care about you. Please talk to someone who can be there with you right now.",
                    ],
                    tool: {
                        title: "🆘 Get Help Now",
                        content: `
                            <p><strong>Please reach out:</strong></p>
                            <ul>
                                <li><a href="tel:988" style="color: #c4b5fd;">988</a> — Suicide & Crisis Lifeline</li>
                                <li><a href="sms:741741" style="color: #c4b5fd;">Text HOME to 741741</a> — Crisis Text Line</li>
                                <li><a href="tel:18007997233" style="color: #c4b5fd;">1-800-799-7233</a> — Domestic Violence Hotline</li>
                                <li><a href="tel:18006564673" style="color: #c4b5fd;">1-800-656-4673</a> — RAINN (Sexual Assault)</li>
                            </ul>
                            <p style="margin-top: 12px;">You matter. Your life matters. Please get support. 🕊️</p>
                        `
                    }
                }
            ]
        };
        
        // Keywords
        this.keywords = {
            abuse: ['abuse', 'abused', 'abusive', 'hit me', 'hurt me', 'violent', 'domestic', 'molest', 'assault', 'rape', 'attacked'],
            grief: ['loss', 'lost', 'died', 'death', 'passed away', 'grief', 'grieving', 'miss them', 'gone', 'funeral', 'widow'],
            trauma: ['trauma', 'traumatic', 'ptsd', 'accident', 'war', 'disaster', 'witness', 'attacked', 'violence'],
            unsafe: ['unsafe', 'not safe', 'don\'t feel safe', 'scared', 'in my body', 'body', 'triggered'],
            coping: ['coping', 'cope', 'tools', 'help me', 'techniques', 'strategies', 'deal with'],
            presence: ['just be', 'be with me', 'just here', 'don\'t want to talk', 'just need', 'someone here'],
            flashback: ['flashback', 'dissociat', 'not here', 'reliving', 'feel like i\'m back', 'happening again'],
            nightmares: ['nightmare', 'nightmares', 'can\'t sleep', 'sleep', 'dreams', 'bad dreams'],
            shame: ['shame', 'ashamed', 'disgusting', 'dirty', 'broken', 'damaged', 'worthless'],
            positive: ['thank', 'thanks', 'helped', 'better', 'feel better', 'that helps'],
            crisis: ['kill myself', 'suicide', 'want to die', 'end it', 'hurt myself', 'self harm', 'cutting', 'no point', 'give up']
        };
        
        this.init();
    }
    
    detectApiUrl() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        return 'https://pneuoma-server.onrender.com';
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadHistory();
        this.checkApiHealth();
    }
    
    async checkApiHealth() {
        try {
            const response = await fetch(`${this.apiUrl}/health`, { method: 'GET' });
            this.useApi = response.ok;
            console.log(`🕊️ API ${this.useApi ? 'connected' : 'unavailable'}`);
        } catch (e) {
            this.useApi = false;
        }
    }
    
    cacheElements() {
        this.chatContainer = document.getElementById('chat-container');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.voiceBtn = document.getElementById('voice-btn');
        this.quickOptions = document.getElementById('quick-options');
        this.menuModal = document.getElementById('menu-modal');
        this.helpModal = document.getElementById('help-modal');
        this.groundingModal = document.getElementById('grounding-modal');
        this.breathingModal = document.getElementById('breathing-modal');
        this.breathCircle = document.getElementById('breath-circle');
        this.breathText = document.getElementById('breath-text');
    }
    
    setupEventListeners() {
        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => {
            this.sendBtn.disabled = this.messageInput.value.trim() === '';
        });
        
        // Quick options
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.messageInput.value = btn.dataset.message;
                this.sendMessage();
                this.quickOptions.style.display = 'none';
            });
        });
        
        // Voice
        this.voiceBtn.addEventListener('click', () => this.toggleVoice());
        
        // Back
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });
        
        // Menu
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.menuModal.classList.remove('hidden');
        });
        
        document.getElementById('close-menu').addEventListener('click', () => {
            this.menuModal.classList.add('hidden');
        });
        
        document.getElementById('clear-chat').addEventListener('click', () => {
            this.clearChat();
            this.menuModal.classList.add('hidden');
        });
        
        document.getElementById('get-help').addEventListener('click', () => {
            this.menuModal.classList.add('hidden');
            this.helpModal.classList.remove('hidden');
        });
        
        document.getElementById('close-help').addEventListener('click', () => {
            this.helpModal.classList.add('hidden');
        });
        
        document.getElementById('resources').addEventListener('click', () => {
            window.open('https://www.psychologytoday.com/us/therapists/trauma-and-ptsd', '_blank');
            this.menuModal.classList.add('hidden');
        });
        
        // Grounding
        document.getElementById('grounding').addEventListener('click', () => {
            this.menuModal.classList.add('hidden');
            this.groundingModal.classList.remove('hidden');
        });
        
        document.getElementById('close-grounding').addEventListener('click', () => {
            this.groundingModal.classList.add('hidden');
        });
        
        // Breathing
        document.getElementById('breathing').addEventListener('click', () => {
            this.menuModal.classList.add('hidden');
            this.breathingModal.classList.remove('hidden');
        });
        
        document.getElementById('start-breath').addEventListener('click', () => {
            this.startBreathing();
        });
        
        document.getElementById('close-breathing').addEventListener('click', () => {
            this.stopBreathing();
            this.breathingModal.classList.add('hidden');
        });
    }
    
    startBreathing() {
        if (this.breathingInterval) return;
        
        let phase = 'inhale';
        this.breathCircle.classList.add('inhale');
        this.breathText.textContent = 'Breathe In...';
        
        this.breathingInterval = setInterval(() => {
            if (phase === 'inhale') {
                phase = 'hold1';
                this.breathText.textContent = 'Hold...';
            } else if (phase === 'hold1') {
                phase = 'exhale';
                this.breathCircle.classList.remove('inhale');
                this.breathCircle.classList.add('exhale');
                this.breathText.textContent = 'Breathe Out...';
            } else if (phase === 'exhale') {
                phase = 'hold2';
                this.breathText.textContent = 'Hold...';
            } else {
                phase = 'inhale';
                this.breathCircle.classList.remove('exhale');
                this.breathCircle.classList.add('inhale');
                this.breathText.textContent = 'Breathe In...';
            }
        }, 4000);
    }
    
    stopBreathing() {
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
            this.breathingInterval = null;
        }
        this.breathCircle.classList.remove('inhale', 'exhale');
        this.breathText.textContent = 'Breathe In';
    }
    
    sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || this.isTyping) return;
        
        this.addMessage(text, 'user');
        this.messageInput.value = '';
        this.sendBtn.disabled = true;
        
        this.conversationHistory.push({ role: 'user', content: text });
        this.saveHistory();
        
        this.quickOptions.style.display = 'none';
        
        setTimeout(() => this.generateResponse(text), 500);
    }
    
    async generateResponse(userMessage) {
        if (this.useApi) {
            try {
                const aiResponse = await this.callApi(userMessage);
                if (aiResponse) {
                    this.showAiResponse(aiResponse);
                    return;
                }
            } catch (e) {
                console.log('API call failed, using local fallback');
            }
        }
        this.generateLocalResponse(userMessage);
    }
    
    async callApi(message) {
        try {
            const response = await fetch(`${this.apiUrl}/api/companion/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companion: 'haven',
                    message: message,
                    history: this.conversationHistory.slice(-10)
                })
            });
            if (!response.ok) throw new Error('API error');
            const data = await response.json();
            return data.response;
        } catch (e) {
            return null;
        }
    }
    
    showAiResponse(text) {
        this.isTyping = true;
        this.showTypingIndicator();
        
        const messages = text.split('\n\n').filter(m => m.trim());
        let delay = 1200;
        
        messages.forEach((msg, index) => {
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessage(msg.trim(), 'companion');
                if (index < messages.length - 1) {
                    setTimeout(() => this.showTypingIndicator(), 400);
                } else {
                    this.isTyping = false;
                }
            }, delay);
            delay += 1200 + (msg.length * 18);
        });
        
        this.conversationHistory.push({ role: 'companion', content: text });
        this.saveHistory();
    }
    
    generateLocalResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Crisis first
        if (this.matchesKeywords(lowerMessage, this.keywords.crisis)) {
            this.showResponse(this.responses.crisis[0]);
            return;
        }
        
        let responseCategory = 'default';
        
        for (const [category, keywords] of Object.entries(this.keywords)) {
            if (category === 'crisis') continue;
            if (this.matchesKeywords(lowerMessage, keywords)) {
                responseCategory = category;
                break;
            }
        }
        
        const responses = this.responses[responseCategory];
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        this.showResponse(response);
    }
    
    matchesKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    showResponse(response) {
        this.isTyping = true;
        this.showTypingIndicator();
        
        const messages = response.messages || [];
        let delay = 1200;
        
        messages.forEach((msg, index) => {
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessage(msg, 'companion');
                if (index < messages.length - 1) {
                    setTimeout(() => this.showTypingIndicator(), 400);
                }
            }, delay);
            delay += 1500 + (msg.length * 18);
        });
        
        if (response.affirmation) {
            setTimeout(() => {
                this.addAffirmation(response.affirmation);
            }, delay);
            delay += 600;
        }
        
        if (response.tool) {
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addToolCard(response.tool);
            }, delay);
            delay += 600;
        }
        
        if (response.followUp) {
            setTimeout(() => {
                this.showTypingIndicator();
                setTimeout(() => {
                    this.hideTypingIndicator();
                    this.addMessage(response.followUp, 'companion');
                    this.isTyping = false;
                }, 1200);
            }, delay);
        } else {
            setTimeout(() => {
                this.isTyping = false;
            }, delay);
        }
        
        this.conversationHistory.push({ role: 'companion', content: messages.join(' ') });
        this.saveHistory();
    }
    
    addMessage(text, sender) {
        const lastGroup = this.chatContainer.querySelector('.message-group:last-of-type');
        
        if (lastGroup && lastGroup.classList.contains(sender) && !lastGroup.classList.contains('typing')) {
            const content = lastGroup.querySelector('.message-content');
            const message = document.createElement('div');
            message.className = 'message';
            message.innerHTML = `<p>${text}</p>`;
            content.appendChild(message);
        } else {
            const group = document.createElement('div');
            group.className = `message-group ${sender}`;
            
            const avatar = sender === 'companion' ? '🕊️' : '🤍';
            
            group.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message">
                        <p>${text}</p>
                    </div>
                </div>
            `;
            
            this.chatContainer.appendChild(group);
        }
        
        this.scrollToBottom();
    }
    
    addToolCard(tool) {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.innerHTML = `<h4>${tool.title}</h4>${tool.content}`;
        
        const lastGroup = this.chatContainer.querySelector('.message-group.companion:last-of-type .message-content');
        if (lastGroup) {
            lastGroup.appendChild(card);
        }
        
        this.scrollToBottom();
    }
    
    addAffirmation(text) {
        const card = document.createElement('div');
        card.className = 'affirmation-card';
        card.innerHTML = `<p>${text}</p>`;
        
        const lastGroup = this.chatContainer.querySelector('.message-group.companion:last-of-type .message-content');
        if (lastGroup) {
            lastGroup.appendChild(card);
        }
        
        this.scrollToBottom();
        this.vibrate([30, 20, 30]);
    }
    
    showTypingIndicator() {
        this.hideTypingIndicator();
        
        const indicator = document.createElement('div');
        indicator.className = 'message-group companion typing';
        indicator.innerHTML = `
            <div class="message-avatar">🕊️</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(indicator);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const indicator = this.chatContainer.querySelector('.typing');
        if (indicator) indicator.remove();
    }
    
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    toggleVoice() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser.');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        this.voiceBtn.classList.add('listening');
        
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            this.messageInput.value = text;
            this.sendBtn.disabled = false;
            this.voiceBtn.classList.remove('listening');
        };
        
        recognition.onerror = () => this.voiceBtn.classList.remove('listening');
        recognition.onend = () => this.voiceBtn.classList.remove('listening');
        
        recognition.start();
    }
    
    clearChat() {
        const messages = this.chatContainer.querySelectorAll('.message-group:not(:first-child), .quick-options');
        messages.forEach(el => el.remove());
        
        this.quickOptions.style.display = 'flex';
        this.chatContainer.appendChild(this.quickOptions);
        
        this.conversationHistory = [];
        this.saveHistory();
    }
    
    saveHistory() {
        localStorage.setItem('haven-history', JSON.stringify(this.conversationHistory));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('haven-history');
        if (saved) {
            this.conversationHistory = JSON.parse(saved);
        }
    }
    
    vibrate(pattern) {
        if (navigator.vibrate) navigator.vibrate(pattern);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.haven = new Haven();
});

