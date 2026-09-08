const express = require("express");
const cors = require("cors");
const pool = require("./config/database");
const moodRoutes = require("./routes/mood.routes");
const sleepRoutes = require("./routes/sleep.routes");
const stressRoutes = require("./routes/stress.routes");
const usersRoutes = require("./routes/users.routes");
const aiInsightsRoutes = require("./routes/aiInsights");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/mood", moodRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/stress", stressRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/ai-insights", aiInsightsRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "MindTrack AI backend is running successfully",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});