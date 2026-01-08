/**
 * Valor - AI Companion for Veterans with PTSD
 * PNEUMA Companions
 * 
 * Provides trauma-informed support, grounding techniques, and connection to resources.
 * NOT a replacement for professional help.
 */

class Valor {
    constructor() {
        this.conversationHistory = [];
        this.isTyping = false;
        
        // Supportive responses organized by topic
        this.responses = {
            // Flashbacks/Triggers
            triggered: [
                {
                    messages: [
                        "I hear you. Right now, let's focus on one thing: you are SAFE. You are HERE. 🎖️",
                        "The past is the past. Right now, you are in a safe place. Let's ground together.",
                    ],
                    tool: {
                        title: "🌍 Ground Yourself Now",
                        content: `
                            <p><strong>You are not there. You are here.</strong></p>
                            <ul>
                                <li>Feel your feet on the ground. Press them down.</li>
                                <li>Name 5 things you can SEE right now.</li>
                                <li>Touch something cold or textured. Focus on that feeling.</li>
                                <li>Say out loud: "I am safe. I am in [your location]. It is [current year]."</li>
                            </ul>
                            <p style="margin-top: 10px;">Take a slow breath. You've survived 100% of your hardest days.</p>
                        `
                    },
                    followUp: "How are you feeling now? We can keep grounding or just sit here together."
                }
            ],
            
            // Sleep/Nightmares
            sleep: [
                {
                    messages: [
                        "Sleep is one of the hardest parts. When your brain won't let you rest, it's exhausting. I understand. 🎖️",
                        "Nightmares are your mind trying to process what it's seen. It's not a weakness — it's a wound still healing.",
                    ],
                    tool: {
                        title: "🌙 Sleep Support",
                        content: `
                            <p><strong>Before bed:</strong></p>
                            <ul>
                                <li>Create a wind-down routine (same time every night)</li>
                                <li>Avoid screens 1 hour before bed</li>
                                <li>Try 4-7-8 breathing: inhale 4, hold 7, exhale 8</li>
                                <li>Keep something grounding nearby (a photo, a texture)</li>
                            </ul>
                            <p style="margin-top: 10px;"><strong>After a nightmare:</strong></p>
                            <ul>
                                <li>Turn on a light. Say where you are out loud.</li>
                                <li>Touch something cold. Get water.</li>
                                <li>Remind yourself: "That was then. I am safe now."</li>
                                <li>Write it down if it helps release it.</li>
                            </ul>
                        `
                    },
                    followUp: "Have you talked to VA about this? They have treatments specifically for military nightmares that really help."
                }
            ],
            
            // Grounding
            grounding: [
                {
                    messages: [
                        "Let's ground right now. I'm here with you. 🎖️",
                        "Focus on my words. You are safe. You are here, not there.",
                    ],
                    tool: {
                        title: "🌍 5-4-3-2-1 Grounding",
                        content: `
                            <p>Take a breath. Now name:</p>
                            <ul>
                                <li><strong>5</strong> things you can SEE</li>
                                <li><strong>4</strong> things you can TOUCH</li>
                                <li><strong>3</strong> things you can HEAR</li>
                                <li><strong>2</strong> things you can SMELL</li>
                                <li><strong>1</strong> thing you can TASTE</li>
                            </ul>
                            <p style="margin-top: 15px; font-style: italic;">You are not there. You are here. You are safe.</p>
                        `
                    },
                    followUp: "Take your time. I'm not going anywhere."
                }
            ],
            
            // Civilian life adjustment
            civilian: [
                {
                    messages: [
                        "The transition to civilian life is one of the hardest things about coming home. You're not alone in feeling this way. 🎖️",
                        "In the military, you had purpose, structure, brotherhood. Now things feel... different. That loss is real.",
                    ],
                    tool: {
                        title: "🏠 Reintegration",
                        content: `
                            <p><strong>What helps:</strong></p>
                            <ul>
                                <li><strong>Find your people:</strong> Veteran groups, VFW, Team Rubicon, The Mission Continues</li>
                                <li><strong>Create structure:</strong> Your brain still needs routine</li>
                                <li><strong>Find new purpose:</strong> What skills from service can you use?</li>
                                <li><strong>Give yourself time:</strong> Transition takes 1-3 years typically</li>
                            </ul>
                            <p style="margin-top: 10px;">You're not the same person who left. That's okay. You're finding who you are now.</p>
                        `
                    },
                    followUp: "What's been the hardest part of being back? I'd like to understand."
                }
            ],
            
            // Isolation/Loneliness
            isolation: [
                {
                    messages: [
                        "That feeling of nobody understanding — it's one of the heaviest weights a veteran carries. 🎖️",
                        "The people who weren't there can't fully get it. But that doesn't mean you have to carry this alone.",
                    ],
                    tool: {
                        title: "🤝 Finding Your People",
                        content: `
                            <p><strong>Veterans who get it:</strong></p>
                            <ul>
                                <li><strong>Team Rubicon:</strong> Disaster response, uses military skills</li>
                                <li><strong>The Mission Continues:</strong> Service-focused community</li>
                                <li><strong>VFW / American Legion:</strong> Local veteran communities</li>
                                <li><strong>Vet Centers:</strong> Free counseling, groups, by vets for vets</li>
                            </ul>
                            <p style="margin-top: 10px;">Sometimes the best medicine is sitting with someone who's been there too.</p>
                        `
                    },
                    followUp: "Would you be open to connecting with other veterans? Sometimes that shared experience is the bridge."
                }
            ],
            
            // Just need to talk
            talk: [
                {
                    messages: [
                        "I'm here. 🎖️",
                        "Sometimes we just need to know someone's on the other end. I'm that person right now.",
                        "Say whatever's on your mind. I'm not going anywhere."
                    ]
                }
            ],
            
            // Anger/Hypervigilance
            anger: [
                {
                    messages: [
                        "That anger — it served a purpose downrange. It kept you alive. But now it's hard to turn off. 🎖️",
                        "Hypervigilance, the constant scanning for threats... your brain is still in combat mode. That's not a character flaw — it's an adaptation.",
                    ],
                    tool: {
                        title: "🔥 Managing the Fire",
                        content: `
                            <p><strong>When anger rises:</strong></p>
                            <ul>
                                <li><strong>Recognize it:</strong> "This is my combat brain activating."</li>
                                <li><strong>Pause:</strong> 10 seconds before you respond to anything</li>
                                <li><strong>Physical release:</strong> Walk, push-ups, cold water on face</li>
                                <li><strong>Ask:</strong> "Is this threat real, or is my brain overreacting?"</li>
                            </ul>
                            <p style="margin-top: 10px;">You're not broken. You're calibrated for a different environment. We can recalibrate.</p>
                        `
                    },
                    followUp: "What usually triggers it? Understanding the pattern can help."
                }
            ],
            
            // Guilt/Survivor's guilt
            guilt: [
                {
                    messages: [
                        "Carrying guilt for those who didn't come home... that's one of the heaviest burdens. 🎖️",
                        "What you feel is love. It's honor. It's the weight of caring deeply about your brothers and sisters.",
                    ],
                    affirmation: "You survived so you could live. Living fully honors them. 🎖️",
                    followUp: "Would it help to talk about them? Sometimes speaking their names keeps them alive."
                }
            ],
            
            // Positive/Progress
            positive: [
                {
                    messages: [
                        "That takes strength. Real strength. 🎖️",
                        "Every step forward matters, even the small ones. I'm proud of you for showing up today."
                    ]
                }
            ],
            
            // Default support
            default: [
                {
                    messages: [
                        "Thank you for sharing that with me. 🎖️",
                        "I'm here to listen and support however I can. Can you tell me more about what you're going through?"
                    ]
                }
            ],
            
            // Crisis detection
            crisis: [
                {
                    messages: [
                        "I hear you. What you're feeling right now sounds really heavy. 🎖️",
                        "You've made it through every hard day before this one. You can make it through this one too.",
                        "But right now, I need you to reach out to someone who can really be there with you.",
                    ],
                    tool: {
                        title: "🆘 Get Support Now",
                        content: `
                            <p><strong>Veterans Crisis Line — they understand:</strong></p>
                            <ul>
                                <li><a href="tel:18002738255" style="color: #fde047;">Call 1-800-273-8255, Press 1</a></li>
                                <li><a href="sms:838255" style="color: #fde047;">Text 838255</a></li>
                                <li><a href="https://www.veteranscrisisline.net/get-help-now/chat/" target="_blank" style="color: #fde047;">Online Chat</a></li>
                            </ul>
                            <p style="margin-top: 10px;">You served your country. Now let them serve you. Please reach out. 🎖️</p>
                        `
                    }
                }
            ]
        };
        
        // Keywords for response matching
        this.keywords = {
            triggered: ['flashback', 'triggered', 'trigger', 'panic', 'attack', 'ptsd', 'memory', 'memories', 'seeing things', 'reliving'],
            sleep: ['sleep', 'nightmare', 'nightmares', 'insomnia', 'can\'t sleep', 'night', 'dreams', 'bad dreams'],
            grounding: ['ground', 'grounding', 'help me ground', 'not here', 'dissociat'],
            civilian: ['civilian', 'adjust', 'transition', 'home', 'different', 'don\'t fit', 'purpose', 'lost', 'identity'],
            isolation: ['alone', 'lonely', 'isolated', 'nobody understands', 'no one gets it', 'don\'t understand'],
            talk: ['just talk', 'need someone', 'listen', 'vent'],
            anger: ['angry', 'anger', 'rage', 'hypervig', 'on edge', 'snapping', 'outburst', 'irritable'],
            guilt: ['guilt', 'survivor', 'should have been me', 'why did i', 'their fault', 'my fault', 'blame'],
            positive: ['thank', 'thanks', 'better', 'helped', 'feeling better', 'that helps', 'good'],
            crisis: ['kill myself', 'want to die', 'hurt myself', 'suicide', 'end it', 'no point', 'give up', 'done living', 'not worth it']
        };
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadHistory();
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
            window.open('https://www.va.gov/health-care/health-needs-conditions/mental-health/', '_blank');
            this.menuModal.classList.add('hidden');
        });
        
        document.getElementById('grounding').addEventListener('click', () => {
            this.menuModal.classList.add('hidden');
            this.groundingModal.classList.remove('hidden');
        });
        
        document.getElementById('close-grounding').addEventListener('click', () => {
            this.groundingModal.classList.add('hidden');
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
    
    generateResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Check for crisis keywords first
        if (this.matchesKeywords(lowerMessage, this.keywords.crisis)) {
            this.showResponse(this.responses.crisis[0]);
            return;
        }
        
        // Check other keywords
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
            
            const avatar = sender === 'companion' ? '🎖️' : '👤';
            
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
            <div class="message-avatar">🎖️</div>
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
        localStorage.setItem('valor-history', JSON.stringify(this.conversationHistory));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('valor-history');
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
    window.valor = new Valor();
});

