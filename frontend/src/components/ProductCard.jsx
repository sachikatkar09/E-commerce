import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import "../styles/product.css";

const ProductCard = ({ product }) => {
  const { user } = useContext(AuthContext);
  const { toggleWishlist, isWishlisted } = useWishlist();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty: 1
    }));
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    toggleWishlist(product);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        {getPopularBadge()}
          <button 
            className="product-wishlist-btn"
            onClick={handleWishlistToggle}
            style={{ color: isWishlisted(product._id) ? 'red' : 'inherit' }}
          >
          ♡
        </button>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
        />
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <div className="product-rating-stock">
          <div className="product-rating">
            <span className="rating-star">★</span> {product.ratings?.toFixed(1) || "0.0"}
          </div>
          <div className="stock-badge-container">
            {getAvailabilityBadge()}
          </div>
        </div>
        <div className="product-bottom">
          <p className="product-price">₹{product.price}</p>
           <div className="button-container">
             <button className="action-btn add-to-cart" onClick={handleAddToCart}>
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
  );
};

export default ProductCard;
