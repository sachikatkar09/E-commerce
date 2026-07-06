import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/product.css';
import '../styles/about.css';

const FEATURES = [
  { icon: '💎', title: 'Premium Quality', desc: 'Every product is carefully curated and quality-checked before it reaches you.' },
  { icon: '🚚', title: 'Fast Delivery', desc: 'Lightning-fast shipping to your doorstep with real-time tracking.' },
  { icon: '🔒', title: 'Secure Payments', desc: 'Multiple payment options with bank-level encryption for safe transactions.' },
  { icon: '🔄', title: 'Easy Returns', desc: 'Hassle-free return policy within 30 days if you are not satisfied.' },
  { icon: '🎧', title: '24/7 Support', desc: 'Our dedicated support team is always ready to assist you anytime.' },
  { icon: '⭐', title: 'Trusted by Thousands', desc: 'Loved by thousands of happy customers across the country.' }
];

const CATEGORIES = [
  { icon: '📱', name: 'Electronics', desc: 'Smartphones, laptops, gadgets' },
  { icon: '👕', name: 'Fashion', desc: 'Clothing, footwear, accessories' },
  { icon: '🪑', name: 'Furniture', desc: 'Modern home and office furniture' },
  { icon: '🏠', name: 'Home & Kitchen', desc: 'Appliances, decor, essentials' },
  { icon: '🎒', name: 'Accessories', desc: 'Bags, watches, wallets' },
  { icon: '🏋️', name: 'Sports & Fitness', desc: 'Gear, equipment, activewear' }
];

const VALUES = [
  { icon: '✅', title: 'Quality', desc: 'We never compromise on product quality. Every item meets our strict standards.' },
  { icon: '❤️', title: 'Customer Satisfaction', desc: 'Your happiness is our priority. We go above and beyond to delight you.' },
  { icon: '💡', title: 'Innovation', desc: 'Continuously improving our platform for a seamless shopping experience.' },
  { icon: '🤝', title: 'Trust', desc: 'Transparent policies, genuine products, and honest pricing always.' }
];

const EXPERIENCE = [
  { icon: '🔍', title: 'Smart Search', desc: 'Find exactly what you need with intelligent product search and filters.' },
  { icon: '❤️', title: 'Wishlist', desc: 'Save your favorite products and buy them when you are ready.' },
  { icon: '🛒', title: 'Easy Cart', desc: 'Add, remove, and manage items effortlessly before checkout.' },
  { icon: '💳', title: 'Secure Checkout', desc: 'Quick and safe payment process with multiple options.' },
  { icon: '📦', title: 'Order Tracking', desc: 'Track your orders in real-time from dispatch to delivery.' },
  { icon: '📝', title: 'Product Reviews', desc: 'Read honest reviews and ratings from real customers.' }
];

const stats = [
  { label: 'Products', target: 50, suffix: '+' },
  { label: 'Happy Customers', target: 500, suffix: '+' },
  { label: 'Categories', target: 20, suffix: '+' },
  { label: 'Satisfaction', target: 99, suffix: '%' }
];

const Counter = ({ target, suffix }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const duration = 2000;
          const step = Math.max(1, Math.floor(target / (duration / 16)));
          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(current);
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="about-stat-number">
      {count}{suffix}
    </span>
  );
};

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-glow about-hero-glow-1" />
        <div className="about-hero-glow about-hero-glow-2" />
        <div className="about-hero-content">
          <span className="about-pill">About Us</span>
          <h1>
            Welcome to <span>ShopNest</span>
          </h1>
          <p className="about-hero-subtitle">
            Your trusted destination for quality products at affordable prices.
          </p>
          <p className="about-hero-desc">
            ShopNest is built to provide a seamless online shopping experience with carefully
            selected products across multiple categories. We bring you the best deals from
            top brands, all in one place — so you can shop with confidence and ease.
          </p>
          <div className="about-hero-actions">
            <Link to="/shop" className="btn btn-primary">Shop Now</Link>
            <Link to="/categories" className="btn btn-secondary">Explore Categories</Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <div className="about-section-header">
          <span className="about-section-tag">Our Mission</span>
          <h2>Making Online Shopping <span>Simple, Secure & Enjoyable</span></h2>
          <p>
            We believe everyone deserves access to quality products without the hassle.
            ShopNest is committed to offering competitive prices, verified products,
            and fast delivery — all backed by a secure platform you can trust.
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="about-section">
        <div className="about-section-header">
          <span className="about-section-tag">Why Choose Us</span>
          <h2>Why ShopNest?</h2>
          <p>We go the extra mile to make your shopping experience exceptional.</p>
        </div>
        <div className="about-grid about-grid-3">
          {FEATURES.map((f, i) => (
            <div className="about-card" key={i}>
              <div className="about-card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="about-section">
        <div className="about-section-header">
          <span className="about-section-tag">Our Categories</span>
          <h2>Shop by <span>Category</span></h2>
          <p>Explore our wide range of product categories designed for every need.</p>
        </div>
        <div className="about-grid about-grid-3">
          {CATEGORIES.map((c, i) => (
            <Link to="/categories" className="about-card about-card-interactive" key={i}>
              <div className="about-card-icon">{c.icon}</div>
              <h3>{c.name}</h3>
              <p>{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="about-section">
        <div className="about-section-header">
          <span className="about-section-tag">Our Values</span>
          <h2>What We <span>Stand For</span></h2>
          <p>The principles that guide everything we do at ShopNest.</p>
        </div>
        <div className="about-grid about-grid-4">
          {VALUES.map((v, i) => (
            <div className="about-card about-card-compact" key={i}>
              <div className="about-card-icon">{v.icon}</div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shopping Experience */}
      <section className="about-section">
        <div className="about-section-header">
          <span className="about-section-tag">Shopping Experience</span>
          <h2>Designed for <span>Convenience</span></h2>
          <p>Every feature is crafted to make your journey from discovery to delivery smooth and enjoyable.</p>
        </div>
        <div className="about-grid about-grid-3">
          {EXPERIENCE.map((e, i) => (
            <div className="about-card" key={i}>
              <div className="about-card-icon">{e.icon}</div>
              <h3>{e.title}</h3>
              <p>{e.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="about-section">
        <div className="about-stats-bar">
          {stats.map((s, i) => (
            <div className="about-stat-item" key={i}>
              <Counter target={s.target} suffix={s.suffix} />
              <span className="about-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-section">
        <div className="about-cta">
          <div className="about-cta-glow" />
          <h2>Ready to Start Shopping?</h2>
          <p>Discover thousands of products at unbeatable prices. Your next favourite find is just a click away.</p>
          <div className="about-cta-actions">
            <Link to="/shop" className="btn btn-primary">Shop Now</Link>
            <Link to="/categories" className="btn btn-secondary">Explore Categories</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
