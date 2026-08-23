import React from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import '../styles/chatbot.css';

const ChatbotButton = ({ onClick }) => {
  return (
    <button className="chatbot-button" onClick={onClick} aria-label="Chat with us">
      <span className="chatbot-button-tooltip">Chat with us</span>
      <FiMessageSquare size={24} color="#111827" />
    </button>
  );
};

export default ChatbotButton;