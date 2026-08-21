import React, { useState, useRef, useEffect } from 'react';
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
        <h3>AI Shopping Assistant</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      <div className="chat-messages">
        {onSend.messages?.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
            {msg.products?.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me about products..."
        />
        <button onClick={handleSend} className="send-btn">Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;