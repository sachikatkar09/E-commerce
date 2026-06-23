import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSelector } from 'react-redux';
import '../styles/navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        <li><Link to="/shop">Categories</Link></li>
        <li><Link to="/shop">Deals</Link></li>
        <li><Link to="/about">About Us</Link></li>
      </ul>

      <div className="navbar-actions">
        <button type="button" className="icon-button" aria-label="Search">🔍</button>
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
