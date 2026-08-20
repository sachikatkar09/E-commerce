import React from 'react';
import '../styles/chatbot.css';

const ChatbotButton = ({ onClick }) => {
  return (
    <button className="chatbot-button" onClick={onClick} aria-label="Open AI Shopping Assistant">
      🤖
    </button>
  );
};

export default ChatbotButton;