// GS Auto Center Chatbot Widget
// Drop this script tag into any website:
// <script async src="https://YOUR-CHATBOT.vercel.app/widget.js"></script>

(function() {
    const currentScript = document.currentScript;
    const scriptOrigin = currentScript ? new URL(currentScript.src).origin : window.location.origin;

    if (window.__GS_CHAT_WIDGET_INITIALIZED__) {
        console.warn('GS Auto Center chat widget already initialized');
        return;
    }

    const WIDGET_CONFIG = {
        apiUrl: scriptOrigin,
        title: 'GS Auto Center',
        subtitle: 'Онлайн туслах',
        logoUrl: scriptOrigin + '/logo.png',
        icon: '💬'
    };

    // Brand tokens: red #DC0D01 | maroon #5B0702 | charcoal #131313 | off-white #F3F3F3
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap');

        .gs-chat-widget-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 58px;
            height: 58px;
            background: linear-gradient(135deg, #DC0D01 0%, #970902 100%);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 12px 28px -8px rgba(220, 13, 1, 0.55), 0 0 0 1px rgba(220, 13, 1, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            z-index: 999;
            transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1);
            font-family: 'Inter', system-ui, sans-serif;
            color: #FFFFFF;
        }
        .gs-chat-widget-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 36px -10px rgba(220, 13, 1, 0.7), 0 0 0 1px rgba(220, 13, 1, 0.4);
        }
        .gs-chat-widget-button.open { transform: scale(0.95); }

        /* Attention-grabbing pulse ring — paused when chat is open and on hover */
        .gs-chat-widget-button::before,
        .gs-chat-widget-button::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 2px solid rgba(220, 13, 1, 0.55);
            pointer-events: none;
            animation: gs-chat-pulse 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .gs-chat-widget-button::after { animation-delay: 1.1s; }
        .gs-chat-widget-button:hover::before,
        .gs-chat-widget-button:hover::after,
        .gs-chat-widget-button.open::before,
        .gs-chat-widget-button.open::after {
            animation-play-state: paused;
            opacity: 0;
        }

        @keyframes gs-chat-pulse {
            0%   { transform: scale(1);    opacity: 0.75; }
            70%  { transform: scale(1.6);  opacity: 0;    }
            100% { transform: scale(1.6);  opacity: 0;    }
        }

        @media (prefers-reduced-motion: reduce) {
            .gs-chat-widget-button::before,
            .gs-chat-widget-button::after { animation: none; opacity: 0; }
        }
        .gs-chat-widget-button .icon { display: inline-block; transition: opacity 220ms ease, transform 220ms ease; }
        .gs-chat-widget-button .icon-chat { position: relative; opacity: 1; transform: scale(1); }
        .gs-chat-widget-button.open .icon-chat { position: absolute; opacity: 0; transform: scale(0.6); }
        .gs-chat-widget-button .icon-close { position: absolute; opacity: 0; transform: scale(0.6); }
        .gs-chat-widget-button.open .icon-close { position: relative; opacity: 1; transform: scale(1); }

        .gs-chat-widget-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 380px;
            height: 580px;
            max-height: calc(100dvh - 110px);
            background: #131313;
            border-radius: 18px;
            box-shadow: 0 30px 70px -20px rgba(19, 19, 19, 0.85), 0 0 0 1px rgba(220, 13, 1, 0.18);
            display: none;
            flex-direction: column;
            z-index: 998;
            overflow: hidden;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #F3F3F3;
            border: 1px solid rgba(220, 13, 1, 0.18);
            transform-origin: bottom right;
            -webkit-font-smoothing: antialiased;
        }
        .gs-chat-widget-container.open {
            display: flex;
            animation: gs-chat-open 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes gs-chat-open {
            from { opacity: 0; transform: translateY(12px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .gs-chat-widget-header {
            background: linear-gradient(180deg, rgba(220, 13, 1, 0.10), transparent);
            padding: 16px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(220, 13, 1, 0.18);
        }
        .gs-chat-widget-logo-wrap {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #DC0D01 0%, #5B0702 100%);
            color: #FFFFFF;
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 0.02em;
            box-shadow: 0 6px 18px -6px rgba(220, 13, 1, 0.6);
            flex-shrink: 0;
            overflow: hidden;
        }
        .gs-chat-header-info h3 {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #FFFFFF;
        }
        .gs-chat-header-info p {
            margin: 2px 0 0 0;
            font-size: 12px;
            color: #D1D1D1;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .gs-chat-online-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: #22C55E;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.20);
            display: inline-block;
        }
        .gs-chat-header-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: transparent;
            padding: 5px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid rgba(220, 13, 1, 0.25);
            white-space: nowrap;
            color: #E7E7E7;
        }

        .gs-chat-widget-messages {
            flex: 1;
            overflow-y: auto;
            padding: 18px 16px;
            background:
                radial-gradient(600px 280px at 100% 0%, rgba(220, 13, 1, 0.06), transparent 60%),
                #131313;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .gs-chat-widget-messages::-webkit-scrollbar { width: 6px; }
        .gs-chat-widget-messages::-webkit-scrollbar-track { background: transparent; }
        .gs-chat-widget-messages::-webkit-scrollbar-thumb { background: rgba(220, 13, 1, 0.20); border-radius: 999px; }
        .gs-chat-widget-messages::-webkit-scrollbar-thumb:hover { background: rgba(220, 13, 1, 0.4); }

        .gs-chat-widget-message {
            display: flex;
            animation: gs-chat-msg-in 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes gs-chat-msg-in {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .gs-chat-widget-message.user { justify-content: flex-end; }
        .gs-chat-widget-message-content {
            max-width: 82%;
            padding: 11px 14px;
            border-radius: 14px;
            font-size: 14px;
            line-height: 1.6;
            word-wrap: break-word;
        }
        .gs-chat-widget-message.bot .gs-chat-widget-message-content {
            background: #1A1A1A;
            color: #F3F3F3;
            border-top-left-radius: 6px;
            border-left: 2px solid #DC0D01;
        }
        .gs-chat-widget-message.bot .gs-chat-widget-message-content strong,
        .gs-chat-widget-message.bot .gs-chat-widget-message-content b {
            color: #FFFFFF;
            font-weight: 600;
        }
        .gs-chat-widget-message.user .gs-chat-widget-message-content {
            background: #DC0D01;
            color: #FFFFFF;
            border-top-right-radius: 6px;
            box-shadow: 0 6px 18px -10px rgba(220, 13, 1, 0.7);
        }

        .gs-chat-quick-replies {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 4px 0 2px;
            animation: gs-chat-msg-in 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .gs-chat-quick-replies.hidden { display: none; }
        .gs-chat-quick-btn {
            font-family: inherit;
            font-size: 12px;
            line-height: 1.3;
            color: #F3F3F3;
            background: rgba(220, 13, 1, 0.10);
            border: 1px solid rgba(220, 13, 1, 0.35);
            border-radius: 999px;
            padding: 7px 12px;
            cursor: pointer;
            transition: background 160ms ease, border-color 160ms ease, transform 120ms ease;
            text-align: left;
            max-width: 100%;
        }
        .gs-chat-quick-btn:hover {
            background: rgba(220, 13, 1, 0.22);
            border-color: rgba(220, 13, 1, 0.65);
        }
        .gs-chat-quick-btn:active { transform: scale(0.97); }

        .gs-chat-widget-typing {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 13px 14px;
            background: #1A1A1A;
            border-radius: 14px;
            border-top-left-radius: 6px;
            border-left: 2px solid #DC0D01;
            width: fit-content;
        }
        .gs-chat-widget-typing-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: #DC0D01;
            opacity: 0.45;
            animation: gs-chat-typing 1.2s ease-in-out infinite;
        }
        .gs-chat-widget-typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .gs-chat-widget-typing-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes gs-chat-typing {
            0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
            40%           { opacity: 1; transform: translateY(-4px); }
        }

        .gs-chat-widget-input-area {
            padding: 12px 14px;
            border-top: 1px solid rgba(220, 13, 1, 0.18);
            background: #131313;
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .gs-chat-widget-input {
            flex: 1;
            height: 40px;
            padding: 0 14px;
            border: 1px solid rgba(220, 13, 1, 0.20);
            border-radius: 12px;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            transition: border-color 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms cubic-bezier(0.22, 1, 0.36, 1);
            background: #1A1A1A;
            color: #F3F3F3;
        }
        .gs-chat-widget-input:focus {
            border-color: #DC0D01;
            box-shadow: 0 0 0 3px rgba(220, 13, 1, 0.20);
            background: #1A1A1A;
        }
        .gs-chat-widget-input::placeholder { color: #8A8A8A; }

        .gs-chat-widget-send-btn {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 12px;
            background: #DC0D01;
            color: #FFFFFF;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: background 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .gs-chat-widget-send-btn:hover:not(:disabled) { background: #B00B01; }
        .gs-chat-widget-send-btn:active:not(:disabled) { transform: scale(0.96); }
        .gs-chat-widget-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .gs-chat-widget-branding {
            padding: 9px;
            text-align: center;
            background: #131313;
            border-top: 1px solid rgba(220, 13, 1, 0.18);
            font-size: 10px;
            color: #8A8A8A;
            letter-spacing: 0.01em;
        }
        .gs-chat-widget-branding a { color: #8A8A8A; text-decoration: none; transition: color 160ms ease; }
        .gs-chat-widget-branding a:hover { color: #DC0D01; }

        @media (max-width: 480px) {
            .gs-chat-widget-container {
                width: 100%; height: 100dvh; max-height: 100dvh;
                bottom: 0; right: 0; left: 0; top: 0;
                border-radius: 0; border: none;
            }
            .gs-chat-widget-button { bottom: 16px; right: 16px; }
        }

        .gs-chat-widget-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(19, 19, 19, 0.55);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 997;
            animation: gs-chat-fade 220ms ease;
        }
        @keyframes gs-chat-fade { from { opacity: 0; } to { opacity: 1; } }
        .gs-chat-widget-overlay.open { display: block; }
    `;

    const html = `
        <style>${styles}</style>
        <div class="gs-chat-widget-overlay" id="gs-chat-overlay"></div>
        <button class="gs-chat-widget-button" id="gs-chat-toggle" title="GS Auto Center-тэй чатлах">
            <span class="icon icon-chat">${WIDGET_CONFIG.icon}</span>
            <span class="icon icon-close">✕</span>
        </button>
        <div class="gs-chat-widget-container" id="gs-chat-container">
            <div class="gs-chat-widget-header">
                <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                    <div class="gs-chat-widget-logo-wrap">GS</div>
                    <div class="gs-chat-header-info">
                        <h3>${WIDGET_CONFIG.title}</h3>
                        <p><span class="gs-chat-online-dot"></span>${WIDGET_CONFIG.subtitle}</p>
                    </div>
                </div>
                <div class="gs-chat-header-badge">
                    🔧 Toyota · Lexus
                </div>
            </div>
            <div class="gs-chat-widget-messages" id="gs-chat-messages">
                <div class="gs-chat-widget-message bot">
                    <div class="gs-chat-widget-message-content">
                        Сайн байна уу? GS Auto Center-д тавтай морилно уу.<br><br>Бид TOYOTA, LEXUS жийп ангиллын мэргэжлийн засвар үйлчилгээ, JAPAN TOK оригинал сэлбэг санал болгож байна.<br><br>Танд яаж туслах вэ?
                    </div>
                </div>
                <div class="gs-chat-quick-replies" id="gs-chat-quick-replies" role="group" aria-label="Шуурхай асуултууд">
                    <button type="button" class="gs-chat-quick-btn" data-q="Хаана байрладаг вэ?">📍 Хаана байрладаг вэ?</button>
                    <button type="button" class="gs-chat-quick-btn" data-q="Ямар үйлчилгээ байна вэ?">🔧 Ямар үйлчилгээ байна вэ?</button>
                    <button type="button" class="gs-chat-quick-btn" data-q="JAPAN TOK сэлбэг авах боломжтой юу?">🛠️ JAPAN TOK сэлбэг</button>
                    <button type="button" class="gs-chat-quick-btn" data-q="Цаг захиалмаар байна">📞 Цаг захиалах</button>
                    <button type="button" class="gs-chat-quick-btn" data-q="Ажлын цаг хэд вэ?">🕒 Ажлын цаг хэд вэ?</button>
                </div>
            </div>
            <div class="gs-chat-widget-input-area">
                <input
                    type="text"
                    class="gs-chat-widget-input"
                    id="gs-chat-input"
                    placeholder="Зурвас бичих..."
                >
                <button class="gs-chat-widget-send-btn" id="gs-chat-send" aria-label="Илгээх">
                    ➤
                </button>
            </div>
            <div class="gs-chat-widget-branding">
                GS Auto Center · +976 77-200-570
            </div>
        </div>
    `;

    function init() {
        document.body.insertAdjacentHTML('beforeend', html);

        const toggleBtn = document.getElementById('gs-chat-toggle');
        const chatContainer = document.getElementById('gs-chat-container');
        const overlay = document.getElementById('gs-chat-overlay');
        const messagesDiv = document.getElementById('gs-chat-messages');
        const input = document.getElementById('gs-chat-input');
        const sendBtn = document.getElementById('gs-chat-send');
        let chatHistory = [];
        let isLoading = false;

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
                const messages = Array.from(messagesDiv.querySelectorAll('.gs-chat-widget-message:not(#gs-chat-typing)'))
                    .map(msgDiv => {
                        const isUser = msgDiv.classList.contains('user');
                        const content = msgDiv.querySelector('.gs-chat-widget-message-content');
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

        loadChatHistory();

        try {
            const savedMessages = localStorage.getItem('gs-chat-messages');
            if (savedMessages) {
                const parsedMessages = JSON.parse(savedMessages);
                if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                    messagesDiv.innerHTML = '';
                    loadChatMessages();
                }
            }
        } catch (e) { console.error('Failed to check saved messages:', e); }

        function loadWidgetState() {
            try {
                const isOpen = localStorage.getItem('gs-chat-widget-open');
                if (isOpen === 'true' && chatContainer && overlay && toggleBtn) {
                    chatContainer.classList.add('open');
                    overlay.classList.add('open');
                    toggleBtn.classList.add('open');
                }
            } catch (e) { console.error('Failed to load widget state:', e); }
        }

        function saveWidgetState(isOpen) {
            try {
                localStorage.setItem('gs-chat-widget-open', isOpen ? 'true' : 'false');
            } catch (e) { console.error('Failed to save widget state:', e); }
        }

        function toggleChat() {
            chatContainer.classList.toggle('open');
            overlay.classList.toggle('open');
            toggleBtn.classList.toggle('open');
            const isOpen = chatContainer.classList.contains('open');
            saveWidgetState(isOpen);
            if (isOpen) input.focus();
        }

        toggleBtn.addEventListener('click', toggleChat);
        overlay.addEventListener('click', toggleChat);
        loadWidgetState();

        // Quick-reply shortcuts: clicking one fills the input and sends.
        // They disappear once the user has interacted at least once
        // (either via shortcut or by typing).
        const quickReplies = document.getElementById('gs-chat-quick-replies');
        function hideQuickReplies() {
            if (quickReplies && !quickReplies.classList.contains('hidden')) {
                quickReplies.classList.add('hidden');
            }
        }
        if (quickReplies) {
            // If returning user already has a conversation, hide them on load.
            if (chatHistory.length > 0) hideQuickReplies();

            quickReplies.addEventListener('click', (e) => {
                const btn = e.target.closest('.gs-chat-quick-btn');
                if (!btn) return;
                const q = btn.dataset.q || btn.textContent.trim();
                hideQuickReplies();
                input.value = q;
                sendMessage();
            });
        }

        function addMessage(text, sender, shouldSave = true) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `gs-chat-widget-message ${sender}`;
            const content = document.createElement('div');
            content.className = 'gs-chat-widget-message-content';

            if (sender === 'bot') {
                content.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            } else {
                content.textContent = text;
            }

            msgDiv.appendChild(content);
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            if (shouldSave) saveChatMessages();
        }

        function addTyping() {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'gs-chat-widget-message bot';
            msgDiv.id = 'gs-chat-typing';
            const typing = document.createElement('div');
            typing.className = 'gs-chat-widget-typing';
            typing.innerHTML = '<div class="gs-chat-widget-typing-dot"></div><div class="gs-chat-widget-typing-dot"></div><div class="gs-chat-widget-typing-dot"></div>';
            msgDiv.appendChild(typing);
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function removeTyping() {
            const typing = document.getElementById('gs-chat-typing');
            if (typing) typing.remove();
        }

        async function sendMessage() {
            const text = input.value.trim();
            if (!text || isLoading) return;

            hideQuickReplies();
            addMessage(text, 'user');
            input.value = '';
            input.disabled = true;
            sendBtn.disabled = true;
            isLoading = true;

            addTyping();

            try {
                const response = await fetch(`${WIDGET_CONFIG.apiUrl}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history: chatHistory })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Серверийн алдаа гарлаа');

                const reply = data.reply || 'Уучлаарай, одоогоор хариу өгөх боломжгүй байна.';
                addMessage(reply, 'bot');

                chatHistory.push(
                    { role: 'user', content: text },
                    { role: 'assistant', content: reply }
                );
                if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);

                saveChatHistory();
            } catch (error) {
                console.error('Error:', error);
                addMessage(error.message || 'Уучлаарай, системд алдаа гарлаа. Дахин оролдоно уу.', 'bot');
            } finally {
                removeTyping();
                input.disabled = false;
                sendBtn.disabled = false;
                isLoading = false;
                input.focus();
            }
        }

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        window.__GS_CHAT_WIDGET_INITIALIZED__ = true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
