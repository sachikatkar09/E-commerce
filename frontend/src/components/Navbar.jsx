import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useSelector } from 'react-redux';
import { useSearch } from '../context/SearchContext';
import '../styles/navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const { wishlistCount } = useWishlist();
  const { query, setQuery } = useSearch();
  const [openSearch, setOpenSearch] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSearch = () => {
    setOpenSearch((prev) => !prev);
  };

  const closeSearch = () => {
    setOpenSearch(false);
  };

  useEffect(() => {
    if (!openSearch) return undefined;

    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        closeSearch();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeSearch();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openSearch]);

  useEffect(() => {
    if (openSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [openSearch]);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <img src="/ShopNestLogo.png" alt="ShopNest" />
          <span>ShopNest</span>
        </Link>
      </div>

      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/shop">Shop</Link></li>
        <li><Link to="/categories">Categories</Link></li>
        <li><Link to="/deals">Deals</Link></li>
        <li><Link to="/about">About Us</Link></li>
      </ul>

      <div className="navbar-actions">
        <div className="navbar-search-wrapper" ref={searchContainerRef}>
          <button
            type="button"
            className="icon-button"
            aria-label="Search"
            aria-expanded={openSearch}
            onClick={toggleSearch}
          >
            🔍
          </button>

          <div className={`navbar-search-panel ${openSearch ? 'open' : ''}`}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  navigate('/shop');
                  closeSearch();
                }
              }}
              className="navbar-search-input"
              aria-label="Search products"
            />
          </div>
        </div>

        <Link to="/wishlist" className="icon-button cart-button" aria-label="Wishlist">
          ❤️
          <span className="cart-count">{wishlistCount}</span>
        </Link>
        <Link to="/cart" className="icon-button cart-button" aria-label="Cart">
          🛒
          <span className="cart-count">{cartItems.length}</span>
        </Link>
        {user ? (
          <>
            <Link to="/profile" className="profile-link">Hi, {user.name}</Link>
            {user.role === 'admin' && <Link to="/admin" className="profile-link">Admin</Link>}
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </>
        ) : (
          <Link to="/login" className="btn-login">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
