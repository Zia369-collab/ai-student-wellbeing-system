const express = require("express");
const pool = require("../config/database");
const authenticate = require("../middleware/authenticate");

const router = express.Router();


// GET all sleep entries for the logged-in user
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
        sleep_date,
        bedtime,
        wake_time,
        duration_hours,
        sleep_quality,
        note,
        recorded_at
       FROM sleep_entries
       WHERE user_id = $1
       ORDER BY sleep_date DESC, recorded_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching sleep entries:", error);

    res.status(500).json({
      error: "Failed to fetch sleep entries",
    });
  }
});


// POST a new sleep entry for the logged-in user
router.post("/", authenticate, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const {
      sleep_date,
      bedtime,
      wake_time,
      duration_hours,
      sleep_quality,
      note,
    } = req.body;

    if (!sleep_date || duration_hours === undefined) {
      return res.status(400).json({
        error: "Sleep date and duration are required",
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
      `INSERT INTO sleep_entries
        (
          user_id,
          sleep_date,
          bedtime,
          wake_time,
          duration_hours,
          sleep_quality,
          note
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id,
         sleep_date,
         bedtime,
         wake_time,
         duration_hours,
         sleep_quality,
         note,
         recorded_at`,
      [
        userId,
        sleep_date,
        bedtime || null,
        wake_time || null,
        duration_hours,
        sleep_quality || null,
        note || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating sleep entry:", error);

    res.status(500).json({
      error: "Failed to create sleep entry",
    });
  }
});


module.exports = router;