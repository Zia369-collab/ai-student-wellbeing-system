const express = require("express");
const pool = require("../config/database");
const authenticate = require("../middleware/authenticate");

const router = express.Router();


// GET all stress entries for the logged-in user
router.get("/", authenticate, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE firebase_uid = $1",
      [firebaseUid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: "User account not found",
      });
    }

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `SELECT
        id,
        stress_date,
        stress_level,
        trigger,
        note,
        recorded_at
       FROM stress_entries
       WHERE user_id = $1
       ORDER BY stress_date DESC, recorded_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching stress entries:", error);

    res.status(500).json({
      error: "Failed to fetch stress entries",
    });
  }
});


// POST a new stress entry for the logged-in user
router.post("/", authenticate, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const {
      stress_date,
      stress_level,
      trigger,
      note,
    } = req.body;

    if (!stress_date || stress_level === undefined) {
      return res.status(400).json({
        error: "Stress date and stress level are required",
      });
    }

    const level = Number(stress_level);

    if (!Number.isInteger(level) || level < 1 || level > 10) {
      return res.status(400).json({
        error: "Stress level must be an integer between 1 and 10",
      });
    }

    const userResult = await pool.query(
      "SELECT id FROM users WHERE firebase_uid = $1",
      [firebaseUid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: "User account not found",
      });
    }

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO stress_entries
        (
          user_id,
          stress_date,
          stress_level,
          trigger,
          note
        )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id,
         stress_date,
         stress_level,
         trigger,
         note,
         recorded_at`,
      [
        userId,
        stress_date,
        level,
        trigger || null,
        note || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating stress entry:", error);

    res.status(500).json({
      error: "Failed to create stress entry",
    });
  }
});


module.exports = router;