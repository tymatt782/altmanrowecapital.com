
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, ".")));

const users = [];

function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, phone, address, state, password } = req.body;

    if (!fullName || !email || !phone || !address || !state || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    if (findUserByEmail(email)) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: Date.now().toString(),
      fullName,
      email,
      phone,
      address,
      state,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    console.log(`New registration: ${email} - ${fullName}`);

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: { id: user.id, fullName, email }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    console.log(`Login: ${email}`);

    return res.json({
      message: "Login successful",
      token,
      user: { id: user.id, fullName: user.fullName, email }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

app.get("/api/auth/profile", verifyToken, (req, res) => {
  try {
    const user = users.find((u) => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      state: user.state
    });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Support email: support@altmanrowecapital.com`);
});
