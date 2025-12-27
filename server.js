const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
require('dotenv').config();

// middleware
app.use(express.json());

// =======================
// MongoDB Schema & Model
// =======================
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

// =======================
// ROUTES
// =======================

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ✅ Get all users
app.get("/users", async (req, res) => {
  const users = await User.find({}, { password: 0 }); // hide password
  res.json(users);
});

// ✅ Create user (Register)
app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Get user by ID
app.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id, { password: 0 });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
});

// ✅ Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check user
    const dbUser = await User.findOne({ email });
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // compare password
    const isMatched = await bcrypt.compare(password, dbUser.password);
    if (!isMatched) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // generate token
    const token = jwt.sign(
      { userId: dbUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

    
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.log(err));
