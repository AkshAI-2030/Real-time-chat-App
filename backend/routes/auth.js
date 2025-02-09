const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists. Please Login." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ username: username, password: hashedPassword });
    await user.save();
    //user has created so the user has an id (user._id)
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "4h" });
    res
      .status(201)
      .json({ message: "User registered successfully.", token, username }); //returning token and username
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const isPasswordMatch = await user.comparePassword(password); //we will write in UserSchema in Models
    if (!isPasswordMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    res
      .status(200)
      .json({ message: "Login successfull", username: user.username });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while login.", error: error });
  }
});

module.exports = router;
