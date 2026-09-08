const express = require("express");
const pool = require("../config/database");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

/**
 * POST /api/users
 * Create or retrieve the PostgreSQL user
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const email = req.user.email;
    const displayName = req.body.display_name || req.user.name || null;

    if (!email) {
      return res.status(400).json({
        message: "User email is missing from Firebase account",
      });
    }

    // Check whether the user already exists
    const existingUser = await pool.query(
      `SELECT id, firebase_uid, email, display_name
       FROM users
       WHERE firebase_uid = $1`,
      [firebaseUid]
    );

    if (existingUser.rows.length > 0) {
      return res.status(200).json({
        message: "User already exists",
        user: existingUser.rows[0],
      });
    }

    // Create the PostgreSQL user
    const result = await pool.query(
      `INSERT INTO users
       (firebase_uid, email, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, firebase_uid, email, display_name`,
      [firebaseUid, email, displayName]
    );

    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating user:", error);

    res.status(500).json({
      message: "Failed to create user",
    });
  }
});

module.exports = router;