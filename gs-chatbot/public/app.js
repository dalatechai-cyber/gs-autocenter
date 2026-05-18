// GS Auto Center Chatbot Application
// Main chat functionality for the full-page interface

let chatHistory = [];

function loadChatHistory() {
    try {
        const saved = localStorage.getItem('gs-chat-history');
        if (saved) chatHistory = JSON.parse(saved);
    } catch (e) { console.error('Failed to load chat history:', e); }
}

function saveChatHistory() {
    try {
        localStorage.setItem('gs-chat-history', JSON.stringify(chatHistory));
    } catch (e) { console.error('Failed to save chat history:', e); }
}

function loadChatMessages() {
    try {
        const saved = localStorage.getItem('gs-chat-messages');
        if (saved) {
            const messages = JSON.parse(saved);
            messages.forEach(msg => { addMessage(msg.text, msg.sender, false); });
        }
    } catch (e) { console.error('Failed to load chat messages:', e); }
}

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
        localStorage.setItem('gs-chat-messages', JSON.stringify(messages));
    } catch (e) { console.error('Failed to save chat messages:', e); }
}

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('connection-status');

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

    if (shouldSave) saveChatMessages();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function addTypingIndicator() {
    const div = document.createElement('div');
    div.id = 'typing-indicator';
    div.className = 'dt-msg bot';
    div.innerHTML = `
        <div class="dt-typing" aria-label="Туслах хариу бэлдэж байна">
            <span class="dt-typing-dot"></span>
            <span class="dt-typing-dot"></span>
            <span class="dt-typing-dot"></span>
        </div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

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
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatHistory })
            });

            const data = await response.json();

            if (response.status === 429) {
                removeTypingIndicator();
                const retryAfter = data.retryAfter || 60;
                addMessage(`Хэтэрхий олон хүсэлт илгээсэн байна. ${retryAfter} секундын дараа дахин оролдоно уу.`, 'bot');
                return;
            }

            if (!response.ok) throw new Error(data.error || "API Error");

            const reply = data.reply || "Уучлаарай, хариулт алдагдсан байна.";

            removeTypingIndicator();
            addMessage(reply, 'bot');

            chatHistory.push(
                { role: 'user', content: text },
                { role: 'assistant', content: reply }
            );

            if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

            saveChatHistory();

        } catch (error) {
            console.error("Chat error:", error);

            if (retryCount < maxRetries && error.message !== "Invalid input detected") {
                retryCount++;
                console.log(`Retrying... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
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

const EMPTY_STATE_HTML = `
    <div class="dt-empty">
        <div class="dt-empty-orb" aria-hidden="true">
            <svg viewBox="0 0 96 96" width="96" height="96" focusable="false">
                <defs>
                    <radialGradient id="dt-empty-glow-r" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#FCA5A5" stop-opacity="0.95"/>
                        <stop offset="50%" stop-color="#DC0D01" stop-opacity="0.55"/>
                        <stop offset="100%" stop-color="#5B0702" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <circle cx="48" cy="48" r="22" fill="url(#dt-empty-glow-r)">
                    <animate attributeName="r" values="20;26;20" dur="3.2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.85;1;0.85" dur="3.2s" repeatCount="indefinite"/>
                </circle>
                <g fill="none" stroke="#DC0D01" stroke-linecap="round">
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
        <p class="dt-empty-copy">Би <b>GS Auto Center</b>-ийн онлайн туслах. TOYOTA, LEXUS жийпийн засвар, JAPAN TOK сэлбэг, цаг захиалга — танд яаж туслах вэ?</p>
    </div>
`;

function initializeApp() {
    loadChatHistory();

    try {
        const saved = localStorage.getItem('gs-chat-messages');
        if (saved) {
            const parsedMessages = JSON.parse(saved);
            if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                chatMessages.innerHTML = '';
                loadChatMessages();
            }
        }
    } catch (e) { console.error('Failed to check saved messages:', e); }

    statusText.textContent = "Онлайн";
    statusDot.className = "dt-status-dot online";
    userInput.disabled = false;
    sendButton.disabled = false;
    console.log("✅ GS Auto Center Chatbot Ready");

    const clearChatBtn = document.getElementById('clear-chat-btn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (confirm('Харилцааны түүхийг устгах уу?')) {
                localStorage.removeItem('gs-chat-history');
                localStorage.removeItem('gs-chat-messages');
                chatHistory = [];
                chatMessages.innerHTML = EMPTY_STATE_HTML;
                console.log('Chat history cleared');
            }
        });
    }

    const quickReplyButtons = document.querySelectorAll('.quick-reply-btn');
    quickReplyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.textContent.trim();
            const queryMap = {
                '🔧 Үйлчилгээ': 'Та ямар үйлчилгээ үзүүлдэг вэ?',
                '🛠️ JAPAN TOK сэлбэг': 'JAPAN TOK сэлбэгийн талаар дэлгэрэнгүй хэлж өгнө үү.',
                '📍 Байршил, цаг': 'Танай байршил болон цагийн хуваариа хэлж өгнө үү.',
                '📞 Цаг захиалах': 'Цаг хэрхэн захиалах вэ?'
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
