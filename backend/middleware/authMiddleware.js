const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
      return;
    } catch (error) {
      console.error('[protect middleware] Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.warn('[protect middleware] No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const optionalProtect = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (error) {
    console.error('[optionalProtect middleware] Token verification failed:', error.message);
    req.user = null;
  }
  next();
};

module.exports = { protect, optionalProtect };
