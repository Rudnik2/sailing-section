const checkInstructor = (req, res, next) => {
  if (
    (req.isAuthenticated() && req.user.role === "instructor") ||
    req.user.role === "admin"
  ) {
    return next();
  }
  res.status(403).json({ error: "Access denied" });
};

const checkAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Access denied" });
};

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};

module.exports = {
  checkInstructor,
  checkAdmin,
  ensureAuthenticated,
};
