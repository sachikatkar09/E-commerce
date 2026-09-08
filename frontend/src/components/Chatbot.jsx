import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FiSend } from "react-icons/fi";
import ProductCard from "./ProductCard";
import "../styles/chatbot.css";

const WELCOME_MESSAGE = { sender: "ai", text: "Hi! 👋\nHow can I help you today?" };
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1200;

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buildConversationHistory = () => {
    return messages
      .filter((m) => m.text && !m.products)
      .slice(-10)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();

    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    const isImage = imageExtensions.some((ext) =>
      input.toLowerCase().includes(ext),
    );
    if (isImage) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Image upload is not supported. Please describe the product or ask about it in text.",
        },
      ]);
      setInput("");
      return;
    }

    const userMessage = { sender: "user", text: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const conversationHistory = buildConversationHistory();

    try {
      let attempts = 0;
      while (attempts < MAX_RETRIES) {
        try {
          const response = await axios.post("/api/chat", {
            message: messageText,
            conversationHistory,
          });

          const aiText = response.data && response.data.message;
          const aiProducts =
            (response.data && response.data.products) || [];

          if (!aiText) {
            throw new Error("Empty response from server");
          }

          const aiMessage = {
            sender: "ai",
            text: aiText,
            products: aiProducts.length > 0 ? aiProducts : undefined,
          };

          setMessages([...updatedMessages, aiMessage]);
          return;
        } catch (apiError) {
          attempts++;
          console.error(
            `[Chatbot] API error (attempt ${attempts}/${MAX_RETRIES}):`,
            apiError.response
              ? { status: apiError.response.status, data: apiError.response.data }
              : apiError.message,
          );
          if (attempts < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          }
        }
      }

      setMessages([
        ...updatedMessages,
        {
          sender: "ai",
          text: "Sorry, I'm having trouble connecting to the server. Please check your connection and try again.",
        },
      ]);
    } catch (err) {
      console.error("[Chatbot] Unexpected error:", err);
      setMessages([
        ...updatedMessages,
        {
          sender: "ai",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div>
          <h3>Chat with us</h3>
          <p className="chat-subtitle">AI Shopping Assistant</p>
          <p className="chat-description">
            Ask me about products, prices and recommendations.
          </p>
          <p className="chat-status">
            <span className="status-indicator"></span>Online • Typically replies
            in a few seconds
          </p>
        </div>
        <button
          onClick={onClose}
          className="close-button"
          aria-label="Close chatbot"
        >
          ✕
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.length === 1 &&
          messages[0].sender === "ai" &&
          messages[0].text.includes("Hi!") && (
            <div className="quick-actions">
              <button
                className="quick-action-button"
                onClick={() => setInput("Show me best deals")}
              >
                🏷 Show me best deals
              </button>
              <button
                className="quick-action-button"
                onClick={() => setInput("Recommend products")}
              >
                ✨ Recommend products
              </button>
              <button
                className="quick-action-button"
                onClick={() => setInput("Find a product")}
              >
                🔎 Find a product
              </button>
              <button
                className="quick-action-button"
                onClick={() => setInput("Track my order")}
              >
                📦 Track my order
              </button>
            </div>
          )}
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-content">{msg.text}</div>
            {msg.products && msg.products.length > 0 && (
              <div className="products-grid">
                {msg.products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {isLoading && (
        <div className="message ai">
          <div className="message-content">
            AI is thinking...
            <span className="typing-indicator">● ● ●</span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Ask about products..."
        disabled={isLoading}
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        className="send-button"
      >
        <FiSend size={20} />
      </button>
    </div>
  );
};

export default Chatbot;
