import React, { useState, useEffect, useRef } from 'react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Load chat history and messages from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('dalatech-chat-history');
      const savedMessages = localStorage.getItem('dalatech-chat-messages');
      
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        } else {
          // Set default welcome message
          setMessages([{
            text: 'Сайн байна уу? DalaTech.ai цахим туслахад тавтай морил.<br><br>Танд ямар сэлбэг хэрэгтэй байна вэ?',
            sender: 'bot'
          }]);
        }
      } else {
        // Set default welcome message
        setMessages([{
          text: 'Сайн байна уу? DalaTech.ai цахим туслахад тавтай морил.<br><br>Танд ямар сэлбэг хэрэгтэй байна вэ?',
          sender: 'bot'
        }]);
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      // Set default welcome message on error
      setMessages([{
        text: 'Сайн байна уу? DalaTech.ai цахим туслахад тавтай морил.<br><br>Танд ямар сэлбэг хэрэгтэй байна вэ?',
        sender: 'bot'
      }]);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('dalatech-chat-messages', JSON.stringify(messages));
      }
    } catch (e) {
      console.error('Failed to save messages:', e);
    }
  }, [messages]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    try {
      if (chatHistory.length > 0) {
        localStorage.setItem('dalatech-chat-history', JSON.stringify(chatHistory));
      }
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [chatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Get the API origin from the script tag or use current origin
      const apiUrl = window.location.origin;
      
      const response = await fetch(`${apiUrl}/api/chat`, {
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
      
      // Add bot message
      const botMessage = { text: reply, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);

      // If matches are returned separately, show them
      if (Array.isArray(data.matches) && data.matches.length) {
        const matchesText = formatMatches(data.matches);
        if (matchesText) {
          setMessages(prev => [...prev, { text: matchesText, sender: 'bot' }]);
        }
      }

      // Update chat history
      const newHistory = [
        ...chatHistory,
        { role: 'user', content: text },
        { role: 'assistant', content: reply }
      ];

      // Keep only last 10 exchanges
      const trimmedHistory = newHistory.slice(-10);
      setChatHistory(trimmedHistory);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Уучлаарай, системд алдаа гарлаа. Дахин оролдоно уу.');
      
      // Add error message
      setMessages(prev => [...prev, {
        text: err.message || 'Уучлаарай, системд алдаа гарлаа. Дахин оролдоно уу.',
        sender: 'bot'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMatches = (matches = []) => {
    const list = matches
      .slice(0, 3)
      .map((match, index) => {
        const label = match.name || match.model || 'Нэр тодорхойгүй';
        const code = match.tokCode || match.oemCode || 'код байхгүй';
        const price = match.priceWithVat 
          ? parseInt(match.priceWithVat).toLocaleString() + '₮'
          : 'Үнэ тодорхойгүй';
          
        return `${index + 1}. ${label} (${code}) - <b>${price}</b>`;
      })
      .join('<br>');

    if (!list) return '';
    return `📦 Илэрсэн бараа:<br>${list}`;
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 w-[60px] h-[60px] rounded-full border-none cursor-pointer shadow-lg flex items-center justify-center text-[28px] z-[999] font-serif text-[#ECECEC] transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #2B2B2B 0%, #1F1F1F 100%)',
          transform: isOpen ? 'scale(0.95) rotate(90deg)' : 'scale(1) rotate(0deg)'
        }}
        title={isOpen ? "Close chat" : "Chat with us"}
      >
        <span 
          className="inline-block transition-all duration-500 ease-in-out"
          style={{
            position: isOpen ? 'absolute' : 'relative',
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? 'scale(0) rotate(90deg)' : 'scale(1) rotate(0deg)'
          }}
        >
          💬
        </span>
        <span 
          className="inline-block transition-all duration-500 ease-in-out"
          style={{
            position: isOpen ? 'relative' : 'absolute',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-90deg)'
          }}
        >
          ✕
        </span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-[997]"
          onClick={toggleChat}
          style={{
            animation: 'fadeIn 0.3s ease'
          }}
        />
      )}

      {/* Chat Container */}
      {isOpen && (
        <div
          className="fixed bottom-[90px] right-5 w-[400px] h-[600px] bg-[#1F1F1F] rounded-2xl shadow-2xl flex flex-col z-[998] overflow-hidden font-serif"
          style={{
            animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Header */}
          <div
            className="p-5 rounded-t-2xl flex justify-between items-center"
            style={{
              background: 'linear-gradient(135deg, #2B2B2B 0%, #1F1F1F 100%)',
              color: '#ECECEC'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-[#333]">
                <img
                  src="./logo.jpg"
                  alt="DalaTech.ai Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '💬';
                  }}
                />
              </div>
              <div>
                <h3 className="m-0 text-base font-semibold">DalaTech.ai</h3>
                <p className="m-0 mt-1 text-xs opacity-70 text-[#999]">Цахим туслах</p>
              </div>
            </div>
            <div
              className="bg-white bg-opacity-10 px-2.5 py-1 rounded-[20px] text-[11px] font-medium border border-white border-opacity-10 whitespace-nowrap text-[#999]"
            >
              ✅ 226 Бараа
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#1F1F1F] flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className="max-w-[85%] px-3.5 py-2.5 rounded-[14px] text-sm leading-relaxed break-words"
                  style={{
                    background: msg.sender === 'user' ? '#2B2B2B' : 'transparent',
                    color: '#ECECEC',
                    borderTopRightRadius: msg.sender === 'user' ? '4px' : '14px',
                    borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '14px'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: msg.sender === 'bot' 
                      ? msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
                      : msg.text
                  }}
                />
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex gap-1 px-3.5 py-2.5 bg-transparent rounded-[14px]">
                  <div className="w-2 h-2 rounded-full bg-[#666] animate-typing" />
                  <div className="w-2 h-2 rounded-full bg-[#666] animate-typing" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-[#666] animate-typing" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-[#333] bg-[#1F1F1F] flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Зурвас бичих..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 border-none rounded-[14px] text-sm outline-none transition-all bg-[#333] text-[#ECECEC] placeholder-[#666] focus:bg-[#3a3a3a] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-9 h-9 border-none rounded-full bg-transparent text-[#999] cursor-pointer flex items-center justify-center transition-colors hover:text-[#ECECEC] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➤
            </button>
          </form>

          {/* Branding */}
          <div className="p-2 text-center bg-[#1F1F1F] border-t border-[#2B2B2B] text-[10px] text-[#555555]">
            Powered by{' '}
            <a href="https://www.dalatech.online/" target="_blank" rel="noopener noreferrer" className="text-[#555555] no-underline">
              dalatech.ai
            </a>
          </div>
        </div>
      )}

      {/* Animations - add these to your global styles or include inline */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }
        
        @keyframes typing {
          0%, 60%, 100% { 
            opacity: 0.3; 
            transform: translateY(0); 
          }
          30% { 
            opacity: 1; 
            transform: translateY(-8px); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
        
        .animate-typing {
          animation: typing 1.4s infinite;
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          .fixed.bottom-[90px].right-5 {
            width: calc(100% - 32px);
            height: 70vh;
            bottom: 90px;
            right: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default ChatWidget;
