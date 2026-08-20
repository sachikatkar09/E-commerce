import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';
import '../styles/chatbot.css';

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hi! 👋 How can I help you find something today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', { message: input });
      const aiMessage = { sender: 'ai', text: response.data.message };
      setMessages((prev) => [...prev, aiMessage]);
      
      if (response.data.products && response.data.products.length > 0) {
        const productsMessage = {
          sender: 'ai',
          products: response.data.products,
          text: response.data.message || 'Here are some products I found for you:'
        };
        setMessages((prev) => [...prev, productsMessage]);
      }
    } catch (error) {
      const errorMessage = {
        sender: 'ai',
        text: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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