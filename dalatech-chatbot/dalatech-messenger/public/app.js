// DalaTech.ai Chatbot Application
// Main chat functionality for the full-page interface

// Configuration
let chatHistory = [];

// Load chat history from localStorage
function loadChatHistory() {
    try {
        const saved = localStorage.getItem('dalatech-chat-history');
        if (saved) {
            chatHistory = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load chat history:', e);
    }
}

// Save chat history to localStorage
function saveChatHistory() {
    try {
        localStorage.setItem('dalatech-chat-history', JSON.stringify(chatHistory));
    } catch (e) {
        console.error('Failed to save chat history:', e);
    }
}

// Load chat messages from localStorage
function loadChatMessages() {
    try {
        const saved = localStorage.getItem('dalatech-chat-messages');
        if (saved) {
            const messages = JSON.parse(saved);
            messages.forEach(msg => {
                addMessage(msg.text, msg.sender, false);
            });
        }
    } catch (e) {
        console.error('Failed to load chat messages:', e);
    }
}

// Save chat messages to localStorage
function saveChatMessages() {
    try {
        const messages = Array.from(chatMessages.querySelectorAll('.dt-msg:not(#typing-indicator)'))
            .map(msgDiv => {
                const isUser = msgDiv.classList.contains('user');
                const content = msgDiv.querySelector('.dt-bubble p') || msgDiv.querySelector('.dt-bubble');
                if (!content) return null;
                return {
                    text: isUser ? content.textContent : content.innerHTML,
                    sender: isUser ? 'user' : 'bot'
                };
            })
            .filter(msg => msg !== null);
        localStorage.setItem('dalatech-chat-messages', JSON.stringify(messages));
    } catch (e) {
        console.error('Failed to save chat messages:', e);
    }
}

// DOM Elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('connection-status');

// Add message to chat
function addMessage(text, sender, shouldSave = true) {
    const empty = chatMessages.querySelector('.dt-empty');
    if (empty) empty.remove();

    const div = document.createElement('div');
    div.className = `dt-msg ${sender}`;

    let formattedText = text;
    if (sender === 'bot') {
        formattedText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    }

    div.innerHTML = `<div class="dt-bubble"><p>${sender === 'bot' ? formattedText : escapeHtml(formattedText)}</p></div>`;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (shouldSave) {
        saveChatMessages();
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Add typing indicator
function addTypingIndicator() {
    const div = document.createElement('div');
    div.id = 'typing-indicator';
    div.className = 'dt-msg bot';
    div.innerHTML = `
        <div class="dt-typing" aria-label="Assistant is typing">
            <span class="dt-typing-dot"></span>
            <span class="dt-typing-dot"></span>
            <span class="dt-typing-dot"></span>
        </div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Check message length
    if (text.length > 2000) {
        addMessage("Зурвас хэт урт байна. 2000 тэмдэгтээс богино байх ёстой.", 'bot');
        return;
    }

    addMessage(text, 'user');
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;
    document.getElementById('loader').classList.remove('dt-hidden');
    addTypingIndicator();

    let retryCount = 0;
    const maxRetries = 2;

    async function attemptRequest() {
        try {
            // Call /api/chat endpoint
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: chatHistory
                })
            });

            const data = await response.json();

            // Handle rate limiting
            if (response.status === 429) {
                removeTypingIndicator();
                const retryAfter = data.retryAfter || 60;
                addMessage(`Хэтэрхий олон хүсэлт илгээсэн байна. ${retryAfter} секундын дараа дахин оролдоно уу.`, 'bot');
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || "API Error");
            }

            const reply = data.reply || "Уучлаарай, хариулт алдагдсан байна.";
            
            removeTypingIndicator();
            addMessage(reply, 'bot');
            
            // Update chat history
            chatHistory.push(
                { role: 'user', content: text }, 
                { role: 'assistant', content: reply }
            );
            
            // Keep only last 10 exchanges (20 messages)
            if (chatHistory.length > 20) {
                chatHistory = chatHistory.slice(-20);
            }
            
            // Save chat history to localStorage
            saveChatHistory();

        } catch (error) {
            console.error("Chat error:", error);
            
            // Retry logic
            if (retryCount < maxRetries && error.message !== "Invalid input detected") {
                retryCount++;
                console.log(`Retrying... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
                return attemptRequest();
            }
            
            removeTypingIndicator();
            if (error.message === "Invalid input detected") {
                addMessage("Буруу оролт илэрсэн байна. Та энгийн асуулт асуугаарай.", 'bot');
            } else {
                addMessage("Уучлаарай, системд алдаа гарлаа. Дахин оролдоно уу.", 'bot');
            }
        } finally {
            document.getElementById('loader').classList.add('dt-hidden');
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    await attemptRequest();
});

// Initialize on page load
function initializeApp() {
    // Load chat history and messages from localStorage
    loadChatHistory();
    
    // Check if we have saved messages, if so, clear the default welcome message
    try {
        const saved = localStorage.getItem('dalatech-chat-messages');
        if (saved) {
            const parsedMessages = JSON.parse(saved);
            if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                // Clear the default welcome message
                chatMessages.innerHTML = '';
                loadChatMessages();
            }
        }
    } catch (e) {
        console.error('Failed to check saved messages:', e);
    }
    
    // Set system as ready (no need to fetch product data)
    statusText.textContent = "Систем бэлэн";
    statusDot.className = "dt-status-dot online";
    userInput.disabled = false;
    sendButton.disabled = false;
    console.log("✅ DalaTech.ai Chatbot Ready");
    
    // Clear chat button handler
    const clearChatBtn = document.getElementById('clear-chat-btn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (confirm('Харилцааны түүхийг устгах уу?')) {
                // Clear localStorage
                localStorage.removeItem('dalatech-chat-history');
                localStorage.removeItem('dalatech-chat-messages');
                
                // Clear in-memory data
                chatHistory = [];
                
                // Reset UI to redesigned empty state
                chatMessages.innerHTML = `
                    <div class="dt-empty">
                        <div class="dt-empty-orb" aria-hidden="true">
                            <svg viewBox="0 0 96 96" width="96" height="96" focusable="false">
                                <defs>
                                    <radialGradient id="dt-empty-glow-r" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stop-color="#7DD3FC" stop-opacity="0.95"/>
                                        <stop offset="50%" stop-color="#38BDF8" stop-opacity="0.55"/>
                                        <stop offset="100%" stop-color="#2563EB" stop-opacity="0"/>
                                    </radialGradient>
                                </defs>
                                <circle cx="48" cy="48" r="22" fill="url(#dt-empty-glow-r)">
                                    <animate attributeName="r" values="20;26;20" dur="3.2s" repeatCount="indefinite"/>
                                    <animate attributeName="opacity" values="0.85;1;0.85" dur="3.2s" repeatCount="indefinite"/>
                                </circle>
                                <g fill="none" stroke="#38BDF8" stroke-linecap="round">
                                    <circle cx="48" cy="48" r="34" stroke-width="0.8" stroke-dasharray="44 170" opacity="0.7">
                                        <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="360 48 48" dur="11s" repeatCount="indefinite"/>
                                    </circle>
                                    <circle cx="48" cy="48" r="42" stroke-width="0.6" stroke-dasharray="14 250" opacity="0.5">
                                        <animateTransform attributeName="transform" type="rotate" from="360 48 48" to="0 48 48" dur="14s" repeatCount="indefinite"/>
                                    </circle>
                                </g>
                            </svg>
                        </div>
                        <h2 class="dt-empty-title">Сайн байна уу 👋</h2>
                        <p class="dt-empty-copy">Би <b>DalaTech.ai</b>-н цахим туслах. Танай бизнест AI-г хэрхэн нэвтрүүлэх талаар хэдхэн секундэд хариулъя.</p>
                    </div>
                `;
                
                console.log('Chat history cleared');
            }
        });
    }
    
    // Quick reply buttons handler
    const quickReplyButtons = document.querySelectorAll('.quick-reply-btn');
    quickReplyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.textContent.trim();
            // Map button text to actual queries
            const queryMap = {
                '💰 Үнэ': 'Үнийн талаар хэлж өгнө үү?',
                '🤖 AI Chatbot': 'AI Chatbot-ын тухай мэдээлэл өгнө үү?',
                '🌐 Website': 'Website үйлчилгээний тухай хэлж өгнө үү?',
                '📞 Холбоо барих': 'Холбоо барих мэдээлэл өгнө үү?'
            };
            
            const query = queryMap[text] || text;
            userInput.value = query;
            chatForm.dispatchEvent(new Event('submit'));
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
