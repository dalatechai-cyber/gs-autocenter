// DalaTech.ai Chatbot Widget
// Drop this script tag into any website:
// <script async src="https://dalatech-chatbot.vercel.app/widget.js"></script>

(function() {
    const currentScript = document.currentScript;
    const scriptOrigin = currentScript ? new URL(currentScript.src).origin : window.location.origin;

    // Prevent multiple initialization
    if (window.__DALATECH_WIDGET_INITIALIZED__) {
        console.warn('DalaTech widget already initialized');
        return;
    }

    // Configuration
    const WIDGET_CONFIG = {
        apiUrl: scriptOrigin,
        title: 'DalaTech.ai',
        subtitle: 'Цахим туслах', // Changed "Tuslah" to Cyrillic for consistency
        logoUrl: './logo.jpg', // Changed to use logo.jpg
        icon: '💬'
    };

    // Create widget styles
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap');

        .dalatech-widget-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 58px;
            height: 58px;
            background: linear-gradient(135deg, #2563EB 0%, #38BDF8 100%);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 12px 28px -8px rgba(37, 99, 235, 0.55), 0 0 0 1px rgba(56, 189, 248, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            z-index: 999;
            transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1);
            font-family: 'Inter', system-ui, sans-serif;
            color: #FFFFFF;
        }

        .dalatech-widget-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 36px -10px rgba(37, 99, 235, 0.7), 0 0 0 1px rgba(56, 189, 248, 0.4);
        }

        .dalatech-widget-button.open {
            transform: scale(0.95);
        }

        .dalatech-widget-button .icon {
            display: inline-block;
            transition: opacity 220ms ease, transform 220ms ease;
        }

        .dalatech-widget-button .icon-chat {
            position: relative;
            opacity: 1;
            transform: scale(1);
        }

        .dalatech-widget-button.open .icon-chat {
            position: absolute;
            opacity: 0;
            transform: scale(0.6);
        }

        .dalatech-widget-button .icon-close {
            position: absolute;
            opacity: 0;
            transform: scale(0.6);
        }

        .dalatech-widget-button.open .icon-close {
            position: relative;
            opacity: 1;
            transform: scale(1);
        }

        .dalatech-widget-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 380px;
            height: 580px;
            max-height: calc(100dvh - 110px);
            background: #0D1430;
            border-radius: 18px;
            box-shadow: 0 30px 70px -20px rgba(2, 8, 23, 0.85), 0 0 0 1px rgba(56, 189, 248, 0.15);
            display: none;
            flex-direction: column;
            z-index: 998;
            overflow: hidden;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #F0F4FF;
            border: 1px solid rgba(56, 189, 248, 0.15);
            transform-origin: bottom right;
            -webkit-font-smoothing: antialiased;
        }

        .dalatech-widget-container.open {
            display: flex;
            animation: dtw-open 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes dtw-open {
            from { opacity: 0; transform: translateY(12px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dalatech-widget-header {
            background: linear-gradient(180deg, rgba(37, 99, 235, 0.08), transparent);
            padding: 16px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(56, 189, 248, 0.15);
        }

        .dalatech-widget-logo-wrap {
            width: 38px;
            height: 38px;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #2563EB 0%, #38BDF8 100%);
            color: #FFFFFF;
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 18px;
            letter-spacing: -0.02em;
            box-shadow: 0 6px 18px -6px rgba(37, 99, 235, 0.6);
            flex-shrink: 0;
            overflow: hidden;
        }

        .dalatech-header-info h3 {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #F0F4FF;
        }

        .dalatech-header-info p {
            margin: 2px 0 0 0;
            font-size: 12px;
            color: #8B9FC4;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .dalatech-online-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #22C55E;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
            display: inline-block;
        }

        .dalatech-header-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: transparent;
            padding: 5px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid rgba(56, 189, 248, 0.15);
            white-space: nowrap;
            color: #8B9FC4;
        }

        .dalatech-widget-messages {
            flex: 1;
            overflow-y: auto;
            padding: 18px 16px;
            background:
                radial-gradient(600px 280px at 100% 0%, rgba(37, 99, 235, 0.06), transparent 60%),
                #0D1430;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .dalatech-widget-messages::-webkit-scrollbar { width: 6px; }
        .dalatech-widget-messages::-webkit-scrollbar-track { background: transparent; }
        .dalatech-widget-messages::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.16); border-radius: 999px; }
        .dalatech-widget-messages::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.3); }

        .dalatech-widget-message {
            display: flex;
            animation: dtw-msg-in 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes dtw-msg-in {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .dalatech-widget-message.user {
            justify-content: flex-end;
        }

        .dalatech-widget-message-content {
            max-width: 82%;
            padding: 11px 14px;
            border-radius: 14px;
            font-size: 14px;
            line-height: 1.6;
            word-wrap: break-word;
        }

        .dalatech-widget-message.bot .dalatech-widget-message-content {
            background: #121A3A;
            color: #F0F4FF;
            border-top-left-radius: 6px;
            border-left: 2px solid #38BDF8;
        }

        .dalatech-widget-message.bot .dalatech-widget-message-content strong,
        .dalatech-widget-message.bot .dalatech-widget-message-content b {
            color: #F0F4FF;
            font-weight: 600;
        }

        .dalatech-widget-message.user .dalatech-widget-message-content {
            background: #2563EB;
            color: #FFFFFF;
            border-top-right-radius: 6px;
            box-shadow: 0 6px 18px -10px rgba(37, 99, 235, 0.7);
        }

        .dalatech-widget-typing {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 13px 14px;
            background: #121A3A;
            border-radius: 14px;
            border-top-left-radius: 6px;
            border-left: 2px solid #38BDF8;
            width: fit-content;
        }

        .dalatech-widget-typing-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #38BDF8;
            opacity: 0.45;
            animation: dtw-typing 1.2s ease-in-out infinite;
        }

        .dalatech-widget-typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .dalatech-widget-typing-dot:nth-child(3) { animation-delay: 0.3s; }

        @keyframes dtw-typing {
            0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
            40%           { opacity: 1; transform: translateY(-4px); }
        }

        .dalatech-widget-input-area {
            padding: 12px 14px;
            border-top: 1px solid rgba(56, 189, 248, 0.15);
            background: #0D1430;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .dalatech-widget-input {
            flex: 1;
            height: 40px;
            padding: 0 14px;
            border: 1px solid rgba(56, 189, 248, 0.15);
            border-radius: 12px;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            transition: border-color 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms cubic-bezier(0.22, 1, 0.36, 1);
            background: #050A18;
            color: #F0F4FF;
        }

        .dalatech-widget-input:focus {
            border-color: #38BDF8;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
            background: #121A3A;
        }

        .dalatech-widget-input::placeholder {
            color: #8B9FC4;
        }

        .dalatech-widget-send-btn {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 12px;
            background: #2563EB;
            color: #FFFFFF;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: background 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .dalatech-widget-send-btn:hover:not(:disabled) { background: #1D4ED8; }
        .dalatech-widget-send-btn:active:not(:disabled) { transform: scale(0.96); }

        .dalatech-widget-send-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        .dalatech-widget-branding {
            padding: 9px;
            text-align: center;
            background: #0D1430;
            border-top: 1px solid rgba(56, 189, 248, 0.15);
            font-size: 10px;
            color: #8B9FC4;
            letter-spacing: 0.01em;
        }

        .dalatech-widget-branding a {
            color: #8B9FC4;
            text-decoration: none;
            transition: color 160ms ease;
        }

        .dalatech-widget-branding a:hover {
            color: #38BDF8;
        }

        @media (max-width: 480px) {
            .dalatech-widget-container {
                width: 100%;
                height: 100dvh;
                max-height: 100dvh;
                bottom: 0;
                right: 0;
                left: 0;
                top: 0;
                border-radius: 0;
                border: none;
            }
            .dalatech-widget-button {
                bottom: 16px;
                right: 16px;
            }
        }

        .dalatech-widget-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(2, 8, 23, 0.45);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 997;
            animation: dtw-fade 220ms ease;
        }

        @keyframes dtw-fade {
            from { opacity: 0; }
            to   { opacity: 1; }
        }

        .dalatech-widget-overlay.open {
            display: block;
        }
    `;

    // Create widget HTML
    // Updated Greeting and Header Structure
    const html = `
        <style>${styles}</style>
        <div class="dalatech-widget-overlay" id="dalatech-overlay"></div>
        <button class="dalatech-widget-button" id="dalatech-toggle" title="Chat with us">
            <span class="icon icon-chat">${WIDGET_CONFIG.icon}</span>
            <span class="icon icon-close">✕</span>
        </button>
        <div class="dalatech-widget-container" id="dalatech-container">
            <div class="dalatech-widget-header">
                <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                    <div class="dalatech-widget-logo-wrap">D</div>
                    <div class="dalatech-header-info">
                        <h3>${WIDGET_CONFIG.title}</h3>
                        <p><span class="dalatech-online-dot"></span>${WIDGET_CONFIG.subtitle}</p>
                    </div>
                </div>
                <div class="dalatech-header-badge">
                    ✅ 226 Бараа
                </div>
            </div>
            <div class="dalatech-widget-messages" id="dalatech-messages">
                <div class="dalatech-widget-message bot">
                    <div class="dalatech-widget-message-content">
                        Сайн байна уу? DalaTech.ai цахим туслахад тавтай морил.<br><br>Танд ямар сэлбэг хэрэгтэй байна вэ?
                    </div>
                </div>
            </div>
            <div class="dalatech-widget-input-area">
                <input 
                    type="text" 
                    class="dalatech-widget-input" 
                    id="dalatech-input" 
                    placeholder="Зурвас бичих..."
                >
                <button class="dalatech-widget-send-btn" id="dalatech-send">
                    ➤
                </button>
            </div>
            <div class="dalatech-widget-branding">
                Powered by <a href="https://www.dalatech.online/" target="_blank">dalatech.ai</a>
            </div>
        </div>
    `;

    // Initialize widget
    function init() {
        // Inject widget markup once
        document.body.insertAdjacentHTML('beforeend', html);

        // Get elements
        const toggleBtn = document.getElementById('dalatech-toggle');
        const chatContainer = document.getElementById('dalatech-container');
        const overlay = document.getElementById('dalatech-overlay');
        const messagesDiv = document.getElementById('dalatech-messages');
        const input = document.getElementById('dalatech-input');
        const sendBtn = document.getElementById('dalatech-send');
        let chatHistory = [];
        let isLoading = false;

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
                const messages = Array.from(messagesDiv.querySelectorAll('.dalatech-widget-message:not(#dalatech-typing)'))
                    .map(msgDiv => {
                        const isUser = msgDiv.classList.contains('user');
                        const content = msgDiv.querySelector('.dalatech-widget-message-content');
                        if (!content) return null; // Skip if content not found
                        return {
                            text: isUser ? content.textContent : content.innerHTML,
                            sender: isUser ? 'user' : 'bot'
                        };
                    })
                    .filter(msg => msg !== null); // Remove null entries
                localStorage.setItem('dalatech-chat-messages', JSON.stringify(messages));
            } catch (e) {
                console.error('Failed to save chat messages:', e);
            }
        }

        // Initialize chat history and messages
        loadChatHistory();
        
        // Check if we have saved messages, if so, clear the default welcome message
        try {
            const savedMessages = localStorage.getItem('dalatech-chat-messages');
            if (savedMessages) {
                const parsedMessages = JSON.parse(savedMessages);
                if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                    // Clear the default welcome message
                    messagesDiv.innerHTML = '';
                    loadChatMessages();
                }
            }
        } catch (e) {
            console.error('Failed to check saved messages:', e);
        }

        // Load widget open state from localStorage
        function loadWidgetState() {
            try {
                const isOpen = localStorage.getItem('dalatech-widget-open');
                if (isOpen === 'true') {
                    if (chatContainer && overlay && toggleBtn) {
                        chatContainer.classList.add('open');
                        overlay.classList.add('open');
                        toggleBtn.classList.add('open');
                    } else {
                        const missing = [];
                        if (!chatContainer) missing.push('chatContainer');
                        if (!overlay) missing.push('overlay');
                        if (!toggleBtn) missing.push('toggleBtn');
                        console.error('Widget elements not found when loading state. Missing:', missing.join(', '));
                    }
                }
            } catch (e) {
                console.error('Failed to load widget state:', e);
            }
        }

        // Save widget open state to localStorage
        function saveWidgetState(isOpen) {
            try {
                localStorage.setItem('dalatech-widget-open', isOpen ? 'true' : 'false');
            } catch (e) {
                console.error('Failed to save widget state:', e);
            }
        }

        // Toggle chat
        function toggleChat() {
            chatContainer.classList.toggle('open');
            overlay.classList.toggle('open');
            toggleBtn.classList.toggle('open');
            const isOpen = chatContainer.classList.contains('open');
            saveWidgetState(isOpen);
            if (isOpen) {
                input.focus();
            }
        }

        toggleBtn.addEventListener('click', toggleChat);
        overlay.addEventListener('click', toggleChat);

        // Restore widget state on page load
        loadWidgetState();


        // Add message to chat
        function addMessage(text, sender, shouldSave = true) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `dalatech-widget-message ${sender}`;
            const content = document.createElement('div');
            content.className = 'dalatech-widget-message-content';
            
            if (sender === 'bot') {
                // Allow HTML for bot messages to support bold/breaks
                content.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            } else {
                content.textContent = text;
            }
            
            msgDiv.appendChild(content);
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            
            // Save messages to localStorage
            if (shouldSave) {
                saveChatMessages();
            }
        }

        // Add typing indicator
        function addTyping() {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'dalatech-widget-message bot';
            msgDiv.id = 'dalatech-typing';
            const typing = document.createElement('div');
            typing.className = 'dalatech-widget-typing';
            typing.innerHTML = '<div class="dalatech-widget-typing-dot"></div><div class="dalatech-widget-typing-dot"></div><div class="dalatech-widget-typing-dot"></div>';
            msgDiv.appendChild(typing);
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function removeTyping() {
            const typing = document.getElementById('dalatech-typing');
            if (typing) typing.remove();
        }

        function formatMatches(matches = []) {
            const list = matches
                .slice(0, 3)
                .map((match, index) => {
                    const label = match.name || match.model || 'Нэр тодорхойгүй';
                    const code = match.tokCode || match.oemCode || 'код байхгүй';
                    // Basic fallback formatting if currency formatter isn't available in widget scope
                    const price = match.priceWithVat 
                        ? parseInt(match.priceWithVat).toLocaleString() + '₮'
                        : 'Үнэ тодорхойгүй';
                        
                    return `${index + 1}. ${label} (${code}) - <b>${price}</b>`;
                })
                .join('\n');

            if (!list) return '';
            return `📦 Илэрсэн бараа:\n${list}`;
        }

        // Send the message to the secure server API
        async function sendMessage() {
            const text = input.value.trim();
            if (!text || isLoading) return;

            addMessage(text, 'user');
            input.value = '';
            input.disabled = true;
            sendBtn.disabled = true;
            isLoading = true;

            addTyping();

            try {
                // Using relative path to avoid CORS/404 issues on same domain
                const response = await fetch(`${WIDGET_CONFIG.apiUrl}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        history: chatHistory
                    })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'AI сервер алдаа өглөө');
                }

                const reply = data.reply || 'Уучлаарай, одоогоор хариу өгөх боломжгүй байна.';
                addMessage(reply, 'bot');

                // If matches are returned separately, show them
                if (Array.isArray(data.matches) && data.matches.length) {
                    const matchesText = formatMatches(data.matches);
                    if (matchesText) {
                        addMessage(matchesText, 'bot');
                    }
                }

                chatHistory.push(
                    { role: 'user', content: text },
                    { role: 'assistant', content: reply }
                );
                if (chatHistory.length > 10) {
                    chatHistory = chatHistory.slice(-10);
                }
                
                // Save chat history to localStorage
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

        // Event listeners
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Mark widget as initialized
        window.__DALATECH_WIDGET_INITIALIZED__ = true;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
