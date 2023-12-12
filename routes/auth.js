const express = require("express");
const passport = require("passport");
const User = require("../models/user");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API for user authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Endpoint to register a new user.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in user
 *     description: Endpoint to log in a user.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Login successful", user: req.user });
});

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Log out user
 *     description: Endpoint to log out a user.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Internal server error
 */
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logout successful" });
  });
});

module.exports = router;
