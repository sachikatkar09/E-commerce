import React from "react";
import { FaCommentDots } from "react-icons/fa";

const ChatButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-transform z-50"
    >
      <FaCommentDots size={24} />
    </button>
  );
};

export default ChatButton;