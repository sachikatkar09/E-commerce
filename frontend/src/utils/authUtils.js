import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook to check if user is authenticated and handle redirects
 * @returns {Object} Authentication utilities
 */
export const useAuthCheck = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  const isAuthenticated = () => {
    return !!user;
  };

  /**
   * Redirect to login page with return URL
   * @param {string} fromPath - Path to return to after login
   */
  const redirectToLogin = (fromPath = null) => {
    const returnPath = fromPath || location.pathname;
    navigate(`/login?from=${encodeURIComponent(returnPath)}`);
  };

  /**
   * Check authentication and redirect if not authenticated
   * @param {string} fromPath - Path to return to after login
   * @returns {boolean} True if authenticated, false otherwise
   */
  const checkAuthAndRedirect = (fromPath = null) => {
    if (!isAuthenticated()) {
      redirectToLogin(fromPath);
      return false;
    }
    return true;
  };

  return {
    user,
    isAuthenticated,
    redirectToLogin,
    checkAuthAndRedirect
  };
};

/**
 * Get auth token from localStorage
 * @returns {string|null} JWT token or null
 */
export const getAuthToken = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo);
      return user.token || null;
    } catch (error) {
      console.error('Error parsing userInfo:', error);
      return null;
    }
  }
  return null;
};

/**
 * Make authenticated API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, defaultOptions);
  
  // If unauthorized and token exists, redirect to login
  if (response.status === 401 && token) {
    // Token might be expired, clear it
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  }
  
  return response;
};