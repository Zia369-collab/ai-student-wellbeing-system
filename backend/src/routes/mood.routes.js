const express = require("express");
const pool = require("../config/database");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

/**
 * POST /api/mood
 * Create a new mood entry for the authenticated user
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      mood_score,
      mood_type,
      energy_score,
      note,
    } = req.body;

    if (!mood_score) {
      return res.status(400).json({
        message: "mood_score is required",
      });
    }

    if (mood_score < 1 || mood_score > 10) {
      return res.status(400).json({
        message: "mood_score must be between 1 and 10",
      });
    }

    // Find the PostgreSQL user using the Firebase UID
    const userResult = await pool.query(
      `SELECT id
       FROM users
       WHERE firebase_uid = $1`,
      [req.user.uid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User account not found",
      });
    }

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO mood_entries
       (user_id, mood_score, mood_type, energy_score, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        mood_score,
        mood_type || null,
        energy_score || null,
        note || null,
      ]
    );

    res.status(201).json({
      message: "Mood entry created successfully",
      mood: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating mood entry:", error);

    res.status(500).json({
      message: "Failed to create mood entry",
    });
  }
});

/**
 * GET /api/mood
 * Get mood entries for the authenticated user
 */
router.get("/", authenticate, async (req, res) => {
  try {
    // Find the PostgreSQL user using the Firebase UID
    const userResult = await pool.query(
      `SELECT id
       FROM users
       WHERE firebase_uid = $1`,
      [req.user.uid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User account not found",
      });
    }

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `SELECT *
       FROM mood_entries
       WHERE user_id = $1
       ORDER BY recorded_at DESC`,
      [userId]
    );

    res.json({
      moods: result.rows,
    });
  } catch (error) {
    console.error("Error retrieving mood entries:", error);

    res.status(500).json({
      message: "Failed to retrieve mood entries",
    });
  }
});

module.exports = router;