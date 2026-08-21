import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';
import '../styles/chatbot.css';

const CHAT_HISTORY_KEY = 'chatHistory';
const CONTEXT_KEY = 'chatContext';

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState(() => {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    return savedHistory ? JSON.parse(savedHistory) : [
      { sender: 'ai', text: 'Hi! 👋 How can I help you find something today?' }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [context, setContext] = useState(() => {
    const savedContext = localStorage.getItem(CONTEXT_KEY);
    return savedContext ? JSON.parse(savedContext) : { filters: {} };
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedMessages));
    setInput('');
    setIsLoading(true);
    setRetryCount(0);

    try {
      const response = await axios.post('/api/chat', { message: input, context });
      const aiMessage = { sender: 'ai', text: response.data.message };
      const newMessages = [...updatedMessages, aiMessage];
      setMessages(newMessages);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(newMessages));
      
      // Update context with new filters
      if (response.data.context) {
        const newContext = { ...context, filters: response.data.context };
        setContext(newContext);
        localStorage.setItem(CONTEXT_KEY, JSON.stringify(newContext));
      }
      
      if (response.data.products && response.data.products.length > 0) {
        const productsMessage = {
          sender: 'ai',
          products: response.data.products,
          text: response.data.message || 'Here are some products I found for you:'
        };
        const finalMessages = [...newMessages, productsMessage];
        setMessages(finalMessages);
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(finalMessages));
      }
    } catch (error) {
      let errorMessage;
      if (error.response?.data?.error === 'product_search_failed') {
        errorMessage = {
          sender: 'ai',
          text: 'I couldn’t find matching products. Try adjusting your filters?'
        };
      } else if (retryCount < 2) {
        setRetryCount(retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await handleSend();
        return;
      } else {
        errorMessage = {
          sender: 'ai',
          text: 'Sorry, I’m having trouble right now. Please try again later.'
        };
      }
      const errorMessages = [...updatedMessages, errorMessage];
      setMessages(errorMessages);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(errorMessages));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = () => {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    localStorage.removeItem(CONTEXT_KEY);
    setMessages([{ sender: 'ai', text: 'Hi! 👋 How can I help you find something today?' }]);
    setContext({ filters: {} });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div>
          <h3>AI Shopping Assistant</h3>
          <p>Online • Ask me anything about our products</p>
        </div>
        <button onClick={onClose} className="close-button" aria-label="Close chatbot">
          ✕
        </button>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-content">
              {msg.text}
            </div>
            {msg.products && (
              <div className="products-grid">
                {msg.products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message ai">
            <div className="message-content">
              AI is thinking...
              <span className="typing-indicator">● ● ●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about products, prices, sizes, availability..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;