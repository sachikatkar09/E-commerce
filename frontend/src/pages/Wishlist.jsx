import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/product.css';

const Wishlist = () => {
  const { user } = useContext(AuthContext);
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/wishlist' } });
    }
  }, [user, navigate]);

  return (
    <div className="shop-container">
      <div className="featured-header">
        <div>
          <h2>Your Wishlist</h2>
          <p className="wishlist-subtitle">Saved favorites are waiting for you.</p>
        </div>
      </div>
      {wishlistItems.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">❤️</div>
          <h3>Your Wishlist is Empty</h3>
          <p>Save your favorite products here and shop later.</p>
          <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
        </div>
      ) : (
        <div className="product-grid">
          {wishlistItems.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
