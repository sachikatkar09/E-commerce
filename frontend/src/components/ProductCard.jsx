import React from "react";
import { Link } from "react-router-dom";
import "../styles/product.css";

const ProductCard = ({ product }) => {
  const getAvailabilityBadge = () => {
    if (product.stock > 10)
      return <span className="product-stock-badge in-stock">In Stock</span>;
    if (product.stock > 0)
      return <span className="product-stock-badge low-stock">Low Stock</span>;
    return (
      <span className="product-stock-badge out-of-stock">Out of Stock</span>
    );
  };

  const getPopularBadge = () => {
    if (product.ratings >= 4.5)
      return <span className="product-popular-badge">Popular</span>;
    return null;
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        {getPopularBadge()}
        <button className="product-wishlist-btn">♡</button>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
        />
      </div>
      <div className="product-details">
        <div>
          <h3 className="product-title">{product.name}</h3>
          <div className="product-rating">
            <span className="rating-star">★</span>{" "}
            {product.ratings?.toFixed(1) || "0.0"}
          </div>
        </div>
        <div className="product-actions">
          <p className="product-price">₹{product.price}</p>
          {getAvailabilityBadge()}
          <div className="product-buttons">
            <div className="button-container">
              <button className="action-btn add-to-cart">
                <span className="btn-icon">🛒</span> Add to Cart
              </button>
              <Link
                to={`/product/${product._id}`}
                className="action-btn view-details"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
