const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const driver = require("../config/neo4j");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Register route
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const session = driver.session();

  try {
    // Check if user exists
    const userCheck = await session.run(
      "MATCH (u:User {username: $username}) RETURN u",
      { username }
    );

    if (userCheck.records.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await session.run(
      "CREATE (u:User {username: $username, password: $hashedPassword, role: $role})",
      { username, hashedPassword, role }
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.close();
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const session = driver.session();

  try {
    const result = await session.run(
      "MATCH (u:User {username: $username}) RETURN u",
      { username }
    );

    if (result.records.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userNode = result.records[0].get("u").properties;
    const isMatch = await bcrypt.compare(password, userNode.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { username: userNode.username, role: userNode.role },
      SECRET,
      { expiresIn: "1h" }
    );

    // Enhanced: Return both token and user data
    res.status(200).json({ 
      message: "Login successful", 
      token,
      user: {
        username: userNode.username,
        role: userNode.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.close();
  }
});

// IMPORTANT: Export the router
module.exports = router;