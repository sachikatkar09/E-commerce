import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/product.card.scoped.css';

const ProductCard = ({ product }) => {
  const getAvailabilityBadge = () => {
    if (product.stock > 10) return <span className="badge in-stock">In Stock</span>;
    if (product.stock > 0) return <span className="badge low-stock">Low Stock</span>;
    return <span className="badge out-of-stock">Out of Stock</span>;
  };

  const getPopularBadge = () => {
    if (product.ratings >= 4.5) return <span className="badge popular">Popular</span>;
    return null;
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        {getPopularBadge()}
        <button className="wishlist-btn">
          <span>♡</span>
        </button>
        <img src={product.imageUrl} alt={product.name} className="product-image" />
      </div>
      <div className="product-info">
        <div>
          <h3 className="product-title">{product.name}</h3>
          <div className="card-meta">
            <span className="rating">{product.ratings?.toFixed(1) || '0.0'} <span className="star">★</span></span>
          </div>
        </div>
        <div className="product-bottom">
          <p className="price">₹{product.price}</p>
          {getAvailabilityBadge()}
        </div>
        <div className="action-buttons">
          <button className="btn add-to-cart">🛒 Add to Cart</button>
          <Link to={`/product/${product._id}`} className="btn view-details">View Details</Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;