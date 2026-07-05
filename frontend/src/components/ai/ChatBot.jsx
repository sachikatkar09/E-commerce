import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import '../../styles/ai-chat.css';

const WELCOME_PROMPTS = [
  { icon: '🔥', text: 'Best Deals' },
  { icon: '📱', text: 'Electronics' },
  { icon: '👟', text: 'Running Shoes' },
  { icon: '🪑', text: 'Furniture' },
  { icon: '💰', text: 'Under ₹1000' },
  { icon: '⭐', text: 'Trending Products' }
];

const QUICK_SUGGESTIONS = [
  'Best Deals', 'Electronics', 'Under ₹1000', 'Top Rated', 'New Arrivals'
];

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', content: text.trim(), products: [] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() })
      });

      const data = await res.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process that.',
        products: data.products || []
      }]);
    } catch (err) {
      console.error('[ChatBot] Fetch error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'AI Assistant is temporarily unavailable. Please try again later.',
        products: []
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`ai-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat">
          {/* Header */}
          <div className="ai-header">
            <div className="ai-header-left">
              <div className="ai-avatar">🤖</div>
              <div className="ai-header-info">
                <h4>NexCart AI</h4>
                <span>{isLoading ? 'Thinking...' : 'Online'}</span>
              </div>
            </div>
            <div className="ai-header-actions">
              <button className="ai-header-btn" onClick={clearChat} title="Clear chat">🗑</button>
              <button className="ai-header-btn" onClick={() => setIsOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.length === 0 ? (
              <div className="ai-welcome">
                <div className="ai-welcome-icon">🤖</div>
                <h4>Hi! I'm NexCart AI</h4>
                <p>Your personal shopping assistant. Ask me anything about our products!</p>
                <div className="ai-welcome-prompts">
                  {WELCOME_PROMPTS.map((p, i) => (
                    <button key={i} className="ai-welcome-prompt" onClick={() => sendMessage(p.text)}>
                      <span>{p.icon}</span>{p.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))}
                {isLoading && (
                  <div className="ai-typing">
                    <div className="ai-msg-avatar" style={{ background: 'linear-gradient(135deg, #ff8a00, #ffd54a)', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
                    <div className="ai-typing-dots">
                      <div className="ai-typing-dot" />
                      <div className="ai-typing-dot" />
                      <div className="ai-typing-dot" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (show after a few messages) */}
          {messages.length > 0 && messages.length <= 4 && (
            <div className="ai-suggestions">
              {QUICK_SUGGESTIONS.map((s, i) => (
                <button key={i} className="ai-suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ai-input-area">
            <form className="ai-input-row" onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className="ai-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                rows={1}
                disabled={isLoading}
              />
              <button type="submit" className="ai-send-btn" disabled={!input.trim() || isLoading}>
                <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
