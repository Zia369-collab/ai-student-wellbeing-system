const express = require("express");
const OpenAI = require("openai");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { mood, sleep, stress } = req.body;

    if (!mood || !sleep || !stress) {
      return res.status(400).json({
        error: "Mood, sleep and stress data are required.",
      });
    }

    const prompt =
      "You are MindTrack AI, a supportive wellbeing assistant for university students.\n\n" +
      "Analyse the following student wellbeing data.\n\n" +
      "MOOD DATA:\n" +
      JSON.stringify(mood, null, 2) +
      "\n\n" +
      "SLEEP DATA:\n" +
      JSON.stringify(sleep, null, 2) +
      "\n\n" +
      "STRESS DATA:\n" +
      JSON.stringify(stress, null, 2) +
      "\n\n" +
      "Provide:\n" +
      "1. An overall wellbeing summary\n" +
      "2. Positive patterns\n" +
      "3. Areas that could be improved\n" +
      "4. Three practical recommendations\n\n" +
      "Do not diagnose medical or mental health conditions.\n" +
      "Do not make alarming claims.\n" +
      "Keep the advice supportive, practical and concise.\n\n" +
      "Return ONLY valid JSON using this structure:\n\n" +
      "{\n" +
      '  "overall": "Short overall summary",\n' +
      '  "positive": ["Positive observation", "Positive observation"],\n' +
      '  "areasToImprove": ["Area for improvement", "Area for improvement"],\n' +
      '  "recommendations": ["Recommendation", "Recommendation", "Recommendation"]\n' +
      "}";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a supportive AI wellbeing assistant for university students.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
    });

    const aiResponse = completion.choices[0].message.content;

    let insights;

    try {
      insights = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("AI JSON parsing error:", parseError);

      return res.status(500).json({
        error: "AI returned an invalid response format.",
      });
    }

    res.json({
      success: true,
      insights: insights,
    });
  } catch (error) {
    console.error("AI Insights Error:", error);

    res.status(500).json({
      error: "Unable to generate AI insights.",
    });
  }
});

module.exports = router;