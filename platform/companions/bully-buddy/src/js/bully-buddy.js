/**
 * Bully Buddy - AI Companion for Kids Experiencing Bullying
 * PNEUMA Companions
 * 
 * This provides empathetic, supportive responses with practical tools.
 * NOT a replacement for professional help.
 */

class BullyBuddy {
    constructor() {
        this.conversationHistory = [];
        this.isTyping = false;
        
        // Supportive responses organized by topic
        this.responses = {
            // When someone is being bullied
            bullying: [
                {
                    messages: [
                        "I'm really sorry that's happening to you. Bullying hurts, and your feelings are completely valid. 💙",
                        "Can you tell me a little more about what's going on? Like, where is this happening — at school, online, or somewhere else?"
                    ]
                }
            ],
            
            // When they don't know what to say
            whatToSay: [
                {
                    messages: [
                        "That's totally okay — it's hard to know what to say in the moment! Here are some things that can help:",
                    ],
                    tool: {
                        title: "💬 Things You Can Say",
                        content: `
                            <ul>
                                <li><strong>"Stop. That's not okay."</strong> — Short and clear.</li>
                                <li><strong>"Whatever."</strong> — Then walk away. Sometimes ignoring is powerful.</li>
                                <li><strong>"Why would you say that?"</strong> — Puts it back on them.</li>
                                <li><strong>Nothing at all</strong> — Walk away to a safe place or adult.</li>
                            </ul>
                            <p style="margin-top: 10px;">The goal isn't to "win" — it's to stay safe and not give them what they want (a reaction).</p>
                        `
                    },
                    followUp: "Which of these feels like something you could try? Or would you like to practice what to say?"
                }
            ],
            
            // Feeling bad about themselves
            selfEsteem: [
                {
                    messages: [
                        "I hear you, and I want you to know something important: the things bullies say are about THEM, not you. 💙",
                        "When someone puts you down, it usually means they're hurting inside too. That doesn't make it okay — but it means their words aren't the truth about who you are."
                    ],
                    affirmation: "You are worthy of kindness. You matter. You belong. 💚",
                    followUp: "What's one thing you like about yourself? Even something small."
                }
            ],
            
            // Scared to go back
            scared: [
                {
                    messages: [
                        "Feeling scared makes total sense — your brain is trying to protect you. That's actually really smart! 💙",
                        "Let's think about this together. Are there safe people at school you can be near? A teacher, counselor, or friend?"
                    ],
                    tool: {
                        title: "🛡️ Safety Plan",
                        content: `
                            <p>Let's make a plan:</p>
                            <ul>
                                <li><strong>Safe person:</strong> Who can you go to if something happens?</li>
                                <li><strong>Safe place:</strong> Where can you go to feel safe? (Library, counselor's office?)</li>
                                <li><strong>Safe route:</strong> Can you avoid places where bullying happens?</li>
                                <li><strong>Buddy system:</strong> Can a friend walk with you?</li>
                            </ul>
                        `
                    },
                    followUp: "Would it help to tell a trusted adult what's going on? Sometimes adults don't know unless we tell them."
                }
            ],
            
            // Want to be stronger
            stronger: [
                {
                    messages: [
                        "I love that you want to build your strength! Being strong isn't about fighting back — it's about knowing your worth and not letting anyone take that from you. 💪",
                    ],
                    tool: {
                        title: "💪 Building Inner Strength",
                        content: `
                            <p><strong>Body language matters:</strong></p>
                            <ul>
                                <li>Stand tall, shoulders back</li>
                                <li>Make eye contact (then look away)</li>
                                <li>Speak clearly and calmly</li>
                                <li>Walk with confidence (even if you don't feel it!)</li>
                            </ul>
                            <p style="margin-top: 10px;"><strong>Inner strength comes from:</strong></p>
                            <ul>
                                <li>Knowing you're not alone</li>
                                <li>Having people who believe in you</li>
                                <li>Remembering: this won't last forever</li>
                            </ul>
                        `
                    },
                    followUp: "What makes you feel strong? Is there something you're good at, or someone who believes in you?"
                }
            ],
            
            // Just needs to talk
            talk: [
                {
                    messages: [
                        "I'm here. 💙",
                        "Sometimes we just need someone to listen without trying to fix everything. I'm that friend right now.",
                        "What's on your mind? You can say as much or as little as you want."
                    ]
                }
            ],
            
            // School-related
            school: [
                {
                    messages: [
                        "School bullying is really tough because you have to go back every day. That takes courage. 💙",
                        "Have you talked to any adults at school about this? A teacher, counselor, or principal?"
                    ],
                    followUp: "If you haven't told anyone, would you like to practice what you could say to a trusted adult?"
                }
            ],
            
            // Online/cyberbullying
            online: [
                {
                    messages: [
                        "Online bullying can feel even harder because it follows you home. I'm sorry you're dealing with that. 💙",
                    ],
                    tool: {
                        title: "📱 Handling Cyberbullying",
                        content: `
                            <ul>
                                <li><strong>Screenshot everything</strong> — save evidence before blocking</li>
                                <li><strong>Don't respond</strong> — they want a reaction</li>
                                <li><strong>Block and report</strong> — you have the power to remove them</li>
                                <li><strong>Tell a trusted adult</strong> — this is serious and you don't have to handle it alone</li>
                                <li><strong>Take a break</strong> — it's okay to step away from social media</li>
                            </ul>
                        `
                    },
                    followUp: "Have you been able to block them? And does a parent or guardian know what's happening?"
                }
            ],
            
            // Positive/grateful responses
            positive: [
                {
                    messages: [
                        "That's great to hear! 💙 Every small step forward matters.",
                        "I'm proud of you for working through this. You're stronger than you know."
                    ]
                }
            ],
            
            // Default/general support
            default: [
                {
                    messages: [
                        "Thank you for sharing that with me. 💙",
                        "I'm here to help however I can. Can you tell me more about what you're going through?"
                    ]
                }
            ],
            
            // Crisis detection
            crisis: [
                {
                    messages: [
                        "I'm really glad you told me. What you're feeling sounds really heavy right now. 💙",
                        "I care about you and want to make sure you're safe.",
                        "Please talk to a trusted adult RIGHT NOW — a parent, teacher, counselor, or call 988 (it's free and confidential).",
                    ],
                    tool: {
                        title: "🆘 You Need Real Help",
                        content: `
                            <p><strong>Please reach out to someone who can help:</strong></p>
                            <ul>
                                <li><a href="tel:988" style="color: #60a5fa;">Call 988</a> — Suicide & Crisis Lifeline</li>
                                <li><a href="sms:741741" style="color: #60a5fa;">Text HOME to 741741</a> — Crisis Text Line</li>
                                <li>Tell a parent, teacher, or any trusted adult</li>
                            </ul>
                            <p style="margin-top: 10px;">You matter. Your life matters. Please get help. 💚</p>
                        `
                    }
                }
            ]
        };
        
        // Keywords for response matching
        this.keywords = {
            bullying: ['bully', 'bullying', 'bullied', 'picks on', 'mean to me', 'makes fun', 'teases', 'harasses'],
            whatToSay: ["what to say", "don't know what", "how to respond", "what do i say", "words to say"],
            selfEsteem: ['feel bad', 'hate myself', 'ugly', 'stupid', 'worthless', 'nobody likes', 'no friends', 'loser'],
            scared: ['scared', 'afraid', 'don\'t want to go', 'terrified', 'anxious', 'worried about going'],
            stronger: ['stronger', 'confidence', 'brave', 'stand up', 'defend myself', 'fight back'],
            talk: ['just talk', 'need someone', 'listen', 'vent', 'lonely'],
            school: ['school', 'class', 'classroom', 'teacher', 'recess', 'lunch'],
            online: ['online', 'internet', 'social media', 'instagram', 'snapchat', 'tiktok', 'text', 'message', 'cyber'],
            positive: ['thank', 'thanks', 'better', 'helped', 'good advice', 'feeling better', 'that helps'],
            crisis: ['kill myself', 'want to die', 'hurt myself', 'suicide', 'end it', 'no point', 'give up']
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
            window.open('https://www.stopbullying.gov', '_blank');
            this.menuModal.classList.add('hidden');
        });
    }
    
    sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || this.isTyping) return;
        
        // Add user message
        this.addMessage(text, 'user');
        this.messageInput.value = '';
        this.sendBtn.disabled = true;
        
        // Save to history
        this.conversationHistory.push({ role: 'user', content: text });
        this.saveHistory();
        
        // Hide quick options after first message
        this.quickOptions.style.display = 'none';
        
        // Generate response
        setTimeout(() => this.generateResponse(text), 500);
    }
    
    generateResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Check for crisis keywords first (highest priority)
        if (this.matchesKeywords(lowerMessage, this.keywords.crisis)) {
            this.showResponse(this.responses.crisis[0]);
            return;
        }
        
        // Check other keywords
        let responseCategory = 'default';
        
        for (const [category, keywords] of Object.entries(this.keywords)) {
            if (category === 'crisis') continue; // Already checked
            if (this.matchesKeywords(lowerMessage, keywords)) {
                responseCategory = category;
                break;
            }
        }
        
        // Get response from category
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
            
            delay += 1500 + (msg.length * 20); // Longer messages take more time
        });
        
        // Show tool card if present
        if (response.tool) {
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addToolCard(response.tool);
            }, delay);
            delay += 500;
        }
        
        // Show affirmation if present
        if (response.affirmation) {
            setTimeout(() => {
                this.addAffirmation(response.affirmation);
            }, delay);
            delay += 500;
        }
        
        // Show follow-up question if present
        if (response.followUp) {
            setTimeout(() => {
                this.showTypingIndicator();
                setTimeout(() => {
                    this.hideTypingIndicator();
                    this.addMessage(response.followUp, 'companion');
                    this.isTyping = false;
                }, 1000);
            }, delay);
        } else {
            setTimeout(() => {
                this.isTyping = false;
            }, delay);
        }
        
        // Save to history
        this.conversationHistory.push({ role: 'companion', content: messages.join(' ') });
        this.saveHistory();
    }
    
    addMessage(text, sender) {
        // Check if last message group is from same sender
        const lastGroup = this.chatContainer.querySelector('.message-group:last-of-type');
        
        if (lastGroup && lastGroup.classList.contains(sender)) {
            // Add to existing group
            const content = lastGroup.querySelector('.message-content');
            const message = document.createElement('div');
            message.className = 'message';
            message.innerHTML = `<p>${text}</p>`;
            content.appendChild(message);
        } else {
            // Create new group
            const group = document.createElement('div');
            group.className = `message-group ${sender}`;
            
            const avatar = sender === 'companion' ? '🛡️' : '😊';
            
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
        // Remove existing typing indicator
        this.hideTypingIndicator();
        
        const indicator = document.createElement('div');
        indicator.className = 'message-group companion typing';
        indicator.innerHTML = `
            <div class="message-avatar">🛡️</div>
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
        // Keep only the welcome message
        const messages = this.chatContainer.querySelectorAll('.message-group:not(:first-child), .quick-options');
        messages.forEach(el => el.remove());
        
        // Show quick options again
        this.quickOptions.style.display = 'flex';
        this.chatContainer.appendChild(this.quickOptions);
        
        // Clear history
        this.conversationHistory = [];
        this.saveHistory();
    }
    
    saveHistory() {
        localStorage.setItem('bully-buddy-history', JSON.stringify(this.conversationHistory));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('bully-buddy-history');
        if (saved) {
            this.conversationHistory = JSON.parse(saved);
            // Could replay history here if desired
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
    window.bullyBuddy = new BullyBuddy();
});

