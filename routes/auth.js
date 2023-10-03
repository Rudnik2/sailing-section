const express = require("express");
const passport = require("passport");
const User = require("../models/user"); // Import your User model

const router = express.Router();

// Registration Route
router.post("/register", (req, res) => {
  const { username, password, email } = req.body;
  const newUser = new User({ username, email });
  User.register(newUser, password, (err, user) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: err.message });
    }
    passport.authenticate("local")(req, res, () => {
      res.json({ message: "Registration successful", user });
    });
  });
});

// Login Route
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Login successful", user: req.user });
});

// Logout Route
router.get("/logout", (req, res) => {
  req.logout();
  res.json({ message: "Logout successful" });
});

module.exports = router;
