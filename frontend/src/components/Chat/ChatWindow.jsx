import React, { useState, useRef, useEffect } from 'react';
import { FaCommentDots } from "react-icons/fa";
import ProductCard from '../ProductCard';
import '../../styles/chatbot.css';

const ChatWindow = ({ onClose, onSend }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [onSend]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>
          <h3>Chat with us</h3>
          <p className="chat-subtitle">AI Shopping Assistant</p>
          <p className="chat-status">
            <span className="status-indicator"></span>Online • Typically replies in a few seconds
          </p>
        </div>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      <div className="chat-messages">
        {onSend.messages?.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            <div className="message-content">
              {msg.text}
            </div>
            {msg.products?.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbot-status">
        <span className="status-indicator"></span>
        Online • Typically replies in a few seconds
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about products..."
        />
        <button onClick={handleSend} className="send-btn">
          <FiSend size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;