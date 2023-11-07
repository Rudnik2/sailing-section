// authMiddleware.js

// Middleware to check if the user is an instructor
const checkInstructor = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "instructor") {
    return next(); // User is an instructor, proceed
  }
  // User is not an instructor, deny access
  res.status(403).json({ error: "Access denied" });
};

// Middleware to check if the user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed
  }
  // User is not authenticated, deny access
  res.status(401).json({ error: "Authentication required" });
};

module.exports = {
  checkInstructor,
  ensureAuthenticated,
};
