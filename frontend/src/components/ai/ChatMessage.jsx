import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import { useWishlist } from '../../context/WishlistContext';
import { AuthContext } from '../../context/AuthContext';

/**
 * Renders a single chat message (user or assistant).
 * If the assistant message includes products, renders product cards.
 */
const ChatMessage = ({ message }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useContext(AuthContext);

  const handleAddToCart = (product) => {
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.discountPrice || product.price,
      imageUrl: product.imageUrl,
      qty: 1
    }));
  };

  const handleWishlist = (product) => {
    if (!user) return;
    toggleWishlist(product);
  };

  const handleView = (productId) => {
    navigate(`/product/${productId}`);
  };

  /** Basic markdown → HTML for AI text (bold, italic, line breaks) */
  const formatText = (text) => {
    if (!text) return null;
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className={`ai-msg ${message.role}`}>
      <div className="ai-msg-avatar">
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      <div>
        <div className="ai-msg-bubble">
          {formatText(message.content)}
        </div>

        {message.products && message.products.length > 0 && (
          <div className="ai-products">
            {message.products.map((product) => (
              <div className="ai-product-card" key={product._id}>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="ai-product-img"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=ShopNest'; }}
                />
                <div className="ai-product-info">
                  <div className="ai-product-name" title={product.name}>{product.name}</div>
                  <div className="ai-product-meta">
                    <span className="ai-product-price">₹{product.price}</span>
                    <span className="ai-product-rating">★ {product.ratings?.toFixed(1) || '0.0'}</span>
                    <span className="ai-product-category">{product.category}</span>
                  </div>
                  <div className="ai-product-actions">
                    <button className="ai-product-btn primary" onClick={() => handleView(product._id)}>View</button>
                    {product.stock > 0 && (
                      <button className="ai-product-btn secondary" onClick={() => handleAddToCart(product)}>Add to Cart</button>
                    )}
                    <button
                      className="ai-product-btn wishlist-btn"
                      onClick={() => handleWishlist(product)}
                    >
                      {isWishlisted(product._id) ? '♥' : '♡'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
