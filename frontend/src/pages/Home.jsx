import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import '../styles/product.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data.slice(0, 4)); // Featured products
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="home-container">
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-pill">Best Deals Online</span>
          <h1>
            Welcome to <span>ShopNest</span>
          </h1>
          <p>Discover the best products at unbeatable prices.</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-primary">Shop Now</Link>
            <Link to="/shop" className="btn btn-secondary">Explore Deals</Link>
          </div>
          <div className="hero-features">
            <div className="hero-feature">
              <div className="feature-icon">🚚</div>
              <div>
                <strong>Fast Delivery</strong>
                <p>Reach your door in 24 hours.</p>
              </div>
            </div>
            <div className="hero-feature">
              <div className="feature-icon">🔒</div>
              <div>
                <strong>Secure Checkout</strong>
                <p>Payment protection guaranteed.</p>
              </div>
            </div>
            <div className="hero-feature">
              <div className="feature-icon">⭐</div>
              <div>
                <strong>Top Rated</strong>
                <p>Customer-loved products.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-media">
          <div className="hero-glow hero-glow-purple" />
          <div className="hero-glow hero-glow-orange" />
          <div className="hero-card-visual">
            <span className="hero-tag">Featured</span>
            <div className="hero-image-frame">
              <div className="hero-image" />
            </div>
            <div className="hero-product-details">
              <span>Premium Electronics</span>
              <h3>Wireless Noise-Cancelling Headphones</h3>
              <p className="hero-product-price">₹299.99 <span>₹399.99</span></p>
            </div>
          </div>
        </div>
      </section>

      <div className="featured-header">
        <h2>Featured Products</h2>
        <Link to="/shop" className="view-all">View All</Link>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
