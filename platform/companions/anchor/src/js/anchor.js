/**
 * Anchor - AI Companion for Addiction Recovery
 * PNEUMA Companions
 * 
 * Like a sponsor in your pocket. Craving management, relapse prevention,
 * daily check-ins, and unconditional support.
 * NOT a replacement for professional help, AA/NA, or a real sponsor.
 */

class Anchor {
    constructor() {
        this.conversationHistory = [];
        this.isTyping = false;
        this.todayIntention = localStorage.getItem('anchor-intention') || '';
        this.sobrietyDate = localStorage.getItem('anchor-sobriety-date') || null;
        this.apiUrl = this.detectApiUrl();
        this.useApi = true;
        
        // Supportive responses
        this.responses = {
            // Cravings
            cravings: [
                {
                    messages: [
                        "I hear you. Cravings are hard. But here's what I know: cravings pass. Every single one. 🌱",
                        "Right now feels intense, but this feeling will not last forever. Let's get through the next few minutes together.",
                    ],
                    tool: {
                        title: "🔥 Craving Survival Kit",
                        content: `
                            <p><strong>HALT — Check yourself:</strong></p>
                            <ul>
                                <li><strong>H</strong>ungry? Eat something now.</li>
                                <li><strong>A</strong>ngry? What's really bothering you?</li>
                                <li><strong>L</strong>onely? Call someone. Anyone.</li>
                                <li><strong>T</strong>ired? Rest if you can.</li>
                            </ul>
                            <p style="margin-top: 15px;"><strong>Ride the wave:</strong></p>
                            <ul>
                                <li>Set a 15-minute timer. Just get through those 15 minutes.</li>
                                <li>Change your location. Go outside. Walk.</li>
                                <li>Call your sponsor, a sober friend, or a hotline.</li>
                                <li>Play the tape forward: what happens after you use?</li>
                            </ul>
                        `
                    },
                    followUp: "What triggered this craving? Sometimes naming it takes away its power."
                }
            ],
            
            // Relapse worry
            relapse: [
                {
                    messages: [
                        "The fact that you're worried about relapse shows how much you want your recovery. That awareness is strength. 🌱",
                        "Let's talk about what's making you feel vulnerable right now.",
                    ],
                    tool: {
                        title: "⚠️ Relapse Prevention",
                        content: `
                            <p><strong>Warning signs to watch:</strong></p>
                            <ul>
                                <li>Isolating from support systems</li>
                                <li>Romanticizing the past ("It wasn't that bad")</li>
                                <li>Skipping meetings or check-ins</li>
                                <li>Major stress without coping tools</li>
                                <li>Hanging around old places or people</li>
                            </ul>
                            <p style="margin-top: 15px;"><strong>Protective actions:</strong></p>
                            <ul>
                                <li>Tell someone how you're feeling</li>
                                <li>Go to a meeting today</li>
                                <li>Remove yourself from risky situations</li>
                                <li>Remember why you stopped</li>
                            </ul>
                        `
                    },
                    followUp: "What feels different right now? What's happening in your life that's making recovery harder?"
                }
            ],
            
            // Shame
            shame: [
                {
                    messages: [
                        "Shame is heavy. It tells you that you ARE the problem, not that you HAD a problem. That's a lie. 🌱",
                        "Addiction is a disease. You didn't choose it. But you ARE choosing recovery, and that takes incredible courage.",
                    ],
                    affirmation: "You are not your past. You are not your mistakes. You are who you are becoming. 🌱",
                    tool: {
                        title: "💔 Processing Shame",
                        content: `
                            <p><strong>Remember:</strong></p>
                            <ul>
                                <li>Addiction affects the brain. It's not a moral failure.</li>
                                <li>Many people you admire have faced similar struggles.</li>
                                <li>Making amends takes time. Be patient with yourself.</li>
                                <li>Every day in recovery is proof you're changing.</li>
                            </ul>
                            <p style="margin-top: 10px;"><strong>Healthy guilt vs. toxic shame:</strong></p>
                            <ul>
                                <li>Guilt: "I did something wrong" → leads to change</li>
                                <li>Shame: "I AM something wrong" → leads to hiding</li>
                            </ul>
                            <p style="margin-top: 10px;">You can acknowledge past harm while still believing you deserve recovery.</p>
                        `
                    },
                    followUp: "Is there something specific you're carrying? Sometimes naming it helps release it."
                }
            ],
            
            // Daily check-in
            checkin: [
                {
                    messages: [
                        "Good on you for checking in. That's how we do this — one day at a time. 🌱",
                        "How are you feeling today, honestly? There's no wrong answer.",
                    ],
                    followUp: "On a scale of 1-10, how strong is your recovery feeling today? And what's one thing you're grateful for?"
                }
            ],
            
            // Relationships
            relationships: [
                {
                    messages: [
                        "Repairing relationships is some of the hardest work in recovery. It takes time, and not everyone will come back. That's painful. 🌱",
                        "But here's what you can control: showing up differently, being consistent, and making living amends.",
                    ],
                    tool: {
                        title: "🤝 Rebuilding Trust",
                        content: `
                            <p><strong>Living amends:</strong></p>
                            <ul>
                                <li>Saying sorry is the start, not the end</li>
                                <li>Consistency over time matters most</li>
                                <li>Actions > words. Keep showing up.</li>
                                <li>Accept that some relationships may not heal</li>
                            </ul>
                            <p style="margin-top: 15px;"><strong>What helps:</strong></p>
                            <ul>
                                <li>Be patient. Trust is rebuilt slowly.</li>
                                <li>Don't make promises you can't keep.</li>
                                <li>Accept their timeline, not yours.</li>
                                <li>Focus on being the person they can trust.</li>
                            </ul>
                        `
                    },
                    followUp: "Who are you hoping to rebuild with? What does that relationship mean to you?"
                }
            ],
            
            // Just talking
            talk: [
                {
                    messages: [
                        "I'm here. 🌱",
                        "Sometimes we just need to know someone's listening. I'm that person right now.",
                        "What's on your heart today?"
                    ]
                }
            ],
            
            // Positive responses
            positive: [
                {
                    messages: [
                        "That's beautiful to hear. 🌱",
                        "Every good day in recovery is a miracle. Don't minimize that.",
                        "I'm proud of you. Keep going."
                    ]
                }
            ],
            
            // Slips/Relapses
            slipped: [
                {
                    messages: [
                        "Thank you for telling me. That took courage. 🌱",
                        "A slip doesn't erase your progress. It doesn't make you a failure. It makes you human.",
                        "The question now is: what do we do next?",
                    ],
                    tool: {
                        title: "🌱 After a Slip",
                        content: `
                            <p><strong>Right now:</strong></p>
                            <ul>
                                <li>You're not starting over. You have all the lessons from before.</li>
                                <li>Call someone. Your sponsor, a friend, SAMHSA (1-800-662-4357).</li>
                                <li>Don't let shame send you deeper. This is when you need support most.</li>
                                <li>Get safe. Remove access to substances if you can.</li>
                            </ul>
                            <p style="margin-top: 15px;"><strong>Remember:</strong></p>
                            <ul>
                                <li>Relapse can be part of recovery. It doesn't have to be.</li>
                                <li>What you do in the next 24 hours matters.</li>
                                <li>You got back up. That's what counts.</li>
                            </ul>
                        `
                    },
                    followUp: "What led to this? Understanding the trigger helps prevent it next time."
                }
            ],
            
            // Morning/Starting day
            morning: [
                {
                    messages: [
                        "Good morning. You made it to another day. That's not nothing — that's everything. 🌱",
                        "Today is a new page. What happened yesterday stays there.",
                    ],
                    affirmation: "Just for today, I will stay sober. Just for today, I will be kind to myself. 🌱",
                    followUp: "What's your intention for today? One thing you'll focus on?"
                }
            ],
            
            // Night/End of day
            night: [
                {
                    messages: [
                        "You made it through another day. That's a win. 🌱",
                        "Before you rest, let's take a moment.",
                    ],
                    tool: {
                        title: "🌙 Evening Reflection",
                        content: `
                            <ul>
                                <li>What's one thing you did well today?</li>
                                <li>Did anything threaten your recovery?</li>
                                <li>Is there anyone you need to make amends to?</li>
                                <li>What are you grateful for tonight?</li>
                            </ul>
                        `
                    },
                    affirmation: "You did today. Tomorrow will take care of itself. Rest now. 🌱"
                }
            ],
            
            // Default
            default: [
                {
                    messages: [
                        "I hear you. 🌱",
                        "Tell me more about what's going on. I'm here."
                    ]
                }
            ],
            
            // Crisis
            crisis: [
                {
                    messages: [
                        "I'm really glad you're talking to me right now. What you're feeling sounds really heavy. 🌱",
                        "You don't have to go through this alone. Please reach out to someone who can be there in person.",
                    ],
                    tool: {
                        title: "🆘 Get Help Now",
                        content: `
                            <p><strong>Call right now:</strong></p>
                            <ul>
                                <li><a href="tel:988" style="color: #4ade80;">988</a> — Suicide & Crisis Lifeline</li>
                                <li><a href="tel:18006624357" style="color: #4ade80;">1-800-662-4357</a> — SAMHSA Helpline (24/7)</li>
                            </ul>
                            <p style="margin-top: 15px;">Your life matters. Your sobriety matters. Please reach out. 🌱</p>
                        `
                    }
                }
            ]
        };
        
        // Keywords
        this.keywords = {
            cravings: ['craving', 'cravings', 'urge', 'urges', 'want to use', 'want to drink', 'tempted', 'triggered'],
            relapse: ['relapse', 'relapsing', 'might use', 'worried about', 'close to using', 'about to'],
            shame: ['shame', 'ashamed', 'guilty', 'guilt', 'hate myself', 'terrible person', 'worthless', 'disgust'],
            checkin: ['check in', 'check-in', 'checking in', 'daily', 'how am i doing', 'today'],
            relationships: ['relationship', 'family', 'wife', 'husband', 'kids', 'children', 'marriage', 'friends', 'trust', 'amends', 'repair'],
            talk: ['just talk', 'need someone', 'listen', 'vent', 'lonely'],
            positive: ['thank', 'thanks', 'better', 'helped', 'good day', 'feeling good', 'grateful', 'strong'],
            slipped: ['relapsed', 'slipped', 'used', 'drank', 'fell off', 'messed up'],
            morning: ['good morning', 'morning', 'just woke', 'starting my day', 'new day'],
            night: ['good night', 'night', 'going to bed', 'end of day', 'tonight', 'before bed'],
            crisis: ['kill myself', 'want to die', 'hurt myself', 'suicide', 'end it', 'no point', 'give up', 'overdose']
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
            console.log(`🌱 API ${this.useApi ? 'connected' : 'unavailable'}`);
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
        this.intentionModal = document.getElementById('intention-modal');
        this.serenityModal = document.getElementById('serenity-modal');
        this.intentionInput = document.getElementById('intention-input');
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
        
        // Enable/disable send button
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
        
        // Voice input
        this.voiceBtn.addEventListener('click', () => this.toggleVoice());
        
        // Back button
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
            window.open('https://www.samhsa.gov/find-help', '_blank');
            this.menuModal.classList.add('hidden');
        });
        
        // Intention
        document.getElementById('daily-intention').addEventListener('click', () => {
            this.menuModal.classList.add('hidden');
            this.intentionModal.classList.remove('hidden');
            if (this.todayIntention) {
                this.intentionInput.value = this.todayIntention;
            }
        });
        
        document.getElementById('close-intention').addEventListener('click', () => {
            this.intentionModal.classList.add('hidden');
        });
        
        document.getElementById('save-intention').addEventListener('click', () => {
            const intention = this.intentionInput.value.trim();
            if (intention) {
                this.todayIntention = intention;
                localStorage.setItem('anchor-intention', intention);
                this.intentionModal.classList.add('hidden');
                this.addMessage(`I set my intention: "${intention}"`, 'user');
                setTimeout(() => {
                    this.addMessage(`Beautiful intention. 🌱 Keep it in your heart today. Come back if you need me.`, 'companion');
                }, 500);
            }
        });
        
        document.querySelectorAll('.intention-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.intentionInput.value = btn.dataset.intention;
            });
        });
        
        // Serenity prayer
        document.getElementById('close-serenity')?.addEventListener('click', () => {
            this.serenityModal.classList.add('hidden');
        });
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
                    companion: 'anchor',
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
        let delay = 1000;
        
        messages.forEach((msg, index) => {
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessage(msg.trim(), 'companion');
                if (index < messages.length - 1) {
                    setTimeout(() => this.showTypingIndicator(), 300);
                } else {
                    this.isTyping = false;
                }
            }, delay);
            delay += 1000 + (msg.length * 15);
        });
        
        this.conversationHistory.push({ role: 'companion', content: text });
        this.saveHistory();
    }
    
    generateLocalResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
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
        let delay = 1000;
        
        messages.forEach((msg, index) => {
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessage(msg, 'companion');
                
                if (index < messages.length - 1) {
                    setTimeout(() => this.showTypingIndicator(), 300);
                }
            }, delay);
            
            delay += 1500 + (msg.length * 15);
        });
        
        if (response.tool) {
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addToolCard(response.tool);
            }, delay);
            delay += 500;
        }
        
        if (response.affirmation) {
            setTimeout(() => {
                this.addAffirmation(response.affirmation);
            }, delay);
            delay += 500;
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
            
            const avatar = sender === 'companion' ? '🌱' : '👤';
            
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
        card.innerHTML = `
            <h4>${tool.title}</h4>
            ${tool.content}
        `;
        
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
        this.vibrate([50, 30, 50]);
    }
    
    showTypingIndicator() {
        this.hideTypingIndicator();
        
        const indicator = document.createElement('div');
        indicator.className = 'message-group companion typing';
        indicator.innerHTML = `
            <div class="message-avatar">🌱</div>
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
        if (indicator) {
            indicator.remove();
        }
    }
    
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    toggleVoice() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser. Try Chrome!');
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
        
        recognition.onerror = () => {
            this.voiceBtn.classList.remove('listening');
        };
        
        recognition.onend = () => {
            this.voiceBtn.classList.remove('listening');
        };
        
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
        localStorage.setItem('anchor-history', JSON.stringify(this.conversationHistory));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('anchor-history');
        if (saved) {
            this.conversationHistory = JSON.parse(saved);
        }
    }
    
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.anchor = new Anchor();
});

