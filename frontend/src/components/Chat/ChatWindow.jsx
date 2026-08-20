import React, { useState, useRef, useEffect } from "react";
import Modal from "../UI/Modal";
import ProductCard from "../../ProductCard";
import { Link } from "react-router-dom";

const ChatWindow = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      text: "Hi! 👋 How can I help you find something today?", 
      sender: "ai", 
      products: [],
      context: { query: "", filters: {} },
    },
  ]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState({
    query: "",
    filters: {},
    lastProducts: [],
  });
  const messagesEndRef = useRef(null);

  const extractContext = (input, currentContext) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("cheaper")) {
      return {
        ...currentContext,
        filters: { ...currentContext.filters, price: { $lt: 2000 } },
      };
    } else if (lowerInput.includes("pink")) {
      return {
        query: "pink products",
        filters: { color: "pink" },
        lastProducts: currentContext.lastProducts,
      };
    } else if (lowerInput.includes("shoes")) {
      return {
        query: "shoes",
        filters: { category: "Footwear" },
        lastProducts: currentContext.lastProducts,
      };
    }
    return { query: input, filters: {}, lastProducts: [] };
  };

  const mockBackendCall = async (input, context) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockProducts = [
      { _id: "1", name: "Pink Shoes", price: 1499, images: ["https://example.com/pink-shoes.jpg"] },
      { _id: "2", name: "Black Sneakers", price: 1999, images: ["https://example.com/black-sneakers.jpg"] },
      { _id: "3", name: "Red Shoes", price: 2499, images: ["https://example.com/red-shoes.jpg"] },
    ];

    const filteredProducts = context.filters.price
      ? mockProducts.filter((p) => p.price < context.filters.price.$lt)
      : context.filters.color
      ? mockProducts.filter((p) => p.name.includes(context.filters.color))
      : context.filters.category
      ? mockProducts.filter((p) => p.name.includes(context.filters.category))
      : mockProducts;

    return {
      message: `I found ${filteredProducts.length} products for you:`,
      products: filteredProducts,
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const extractedContext = extractContext(input, context);
    setContext(extractedContext);

    setMessages([...messages, { text: input, sender: "user", products: [], context: extractedContext }]);
    setInput("");

    const mockResponse = await mockBackendCall(input, extractedContext);
    setMessages((prev) => [...prev, {
      text: mockResponse.message, 
      sender: "ai", 
      products: mockResponse.products,
      context: extractedContext,
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-96 w-80">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b">
          <div>
            <h3 className="font-bold text-dark">AI Shopping Assistant</h3>
            <p className="text-xs text-gray-500">Online • Ask me anything about our products</p>
          </div>
          <button onClick={onClose} className="text-dark hover:text-primary">✕</button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto my-2 space-y-2">
          {messages.map((msg, index) => (
            <div key={index} className="space-y-1">
               <div
                 className={`p-2 rounded-lg max-w-xs $
                   msg.sender === "user" ? "ml-auto bg-light" : "mr-auto bg-primary text-white"
                 }`
               >
                 {msg.text}
               </div>
               {msg.products?.length > 0 && (
                 <div className="flex space-x-2 overflow-x-auto py-2 px-2">
                   {msg.products.slice(0, 3).map((product) => (
                     <Link key={product._id} to={`/product/${product._id}`} className="min-w-[150px]">
                       <ProductCard product={{ ...product, imageUrl: product.images?.[0] }} />
                     </Link>
                   ))}
                 </div>
               )}
            </div>
          ))}
           <div ref={messagesEndRef} />
        </div>
        </div>

        {/* Input Area */}
        <div className="flex items-center border-t pt-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about products, prices, sizes, availability..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="ml-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ChatWindow;