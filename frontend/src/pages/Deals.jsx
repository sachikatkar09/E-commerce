import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/product.css';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await fetch('/api/products/deals');
        const data = await res.json();
        setDeals(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  return (
    <div className="shop-container">
      <div className="deal-hero">
        <div className="deal-hero-content">
          <span className="hero-pill">Today&apos;s Deals</span>
          <h2>Premium products at irresistible prices.</h2>
          <p>Explore the best discounted picks from our catalog and save on standout favorites.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading deals...</div>
      ) : deals.length === 0 ? (
        <div className="no-results">No active deals available.</div>
      ) : (
        <div className="deals-grid">
          {deals.map((product) => {
            const originalPrice = Number(product.originalPrice || product.price || 0);
            const discountPercentage = Number(product.discountPercentage || 0);
            const discountedPrice = Number(product.discountPrice || product.price || 0);

            return (
              <article className="deal-card" key={product._id}>
                <div className="deal-badge">{discountPercentage}% OFF</div>
                <img src={product.imageUrl} alt={product.name} className="deal-image" />
                <div className="deal-content">
                  <p className="deal-category">{product.category}</p>
                  <h3>{product.name}</h3>
                  <div className="card-meta">
                    <span>{product.ratings?.toFixed(1) || '0.0'} ★</span>
                    <span>({product.numReviews || 0})</span>
                  </div>
                  <div className="deal-price-row">
                    <span className="deal-original">₹{originalPrice}</span>
                    <span className="deal-price">₹{discountedPrice}</span>
                  </div>
                  <Link to={`/product/${product._id}`} className="btn btn-sm">View</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Deals;
