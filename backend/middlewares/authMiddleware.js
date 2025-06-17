const jwt = require("jsonwebtoken");

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = user;
    next();
  });
};

// Middleware to allow only admins
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

// Middleware to allow only normal users
const authorizeUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Users only" });
  }
  next();
};

module.exports = { authenticateToken, authorizeAdmin, authorizeUser };
