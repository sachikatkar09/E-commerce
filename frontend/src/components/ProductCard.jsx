import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/product.css';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <div className="card-top">
        <span className="product-badge">{product.category || 'Popular'}</span>
        <button type="button" className="favorite-btn">♡</button>
      </div>
      <img src={product.imageUrl} alt={product.name} className="product-image" />
      <div className="product-info">
        <div>
          <h3>{product.name}</h3>
          <div className="card-meta">
            <span>{product.ratings?.toFixed(1) || '0.0'} ★</span>
            <span>({product.numReviews || 0})</span>
          </div>
        </div>
        <div className="product-bottom">
          <p className="price">₹{product.price}</p>
          <Link to={`/product/${product._id}`} className="btn btn-sm">View</Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
