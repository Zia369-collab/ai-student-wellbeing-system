"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function MoodPage() {
  const [user, setUser] = useState<User | null>(null);

  const [moodScore, setMoodScore] = useState(5);
  const [energyScore, setEnergyScore] = useState(5);
  const [moodType, setMoodType] = useState("Neutral");
  const [note, setNote] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [moods, setMoods] = useState<any[]>([]);
  const [loadingMoods, setLoadingMoods] = useState(true);

  // Get the currently authenticated Firebase user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoadingMoods(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch mood history for the authenticated user
  useEffect(() => {
    const fetchMoods = async () => {
      if (!user) {
        return;
      }

      try {
        const token = await user.getIdToken();

        const response = await axios.get(
          "http://localhost:5000/api/mood",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMoods(response.data.moods);
      } catch (error) {
        console.error("Error fetching moods:", error);
        setMessage("Unable to load your mood history.");
      } finally {
        setLoadingMoods(false);
      }
    };

    fetchMoods();
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setMessage("Please log in before recording your mood.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = await user.getIdToken();

      const response = await axios.post(
        "http://localhost:5000/api/mood",
        {
          mood_score: moodScore,
          mood_type: moodType,
          energy_score: energyScore,
          note,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data);

      setMessage("Mood entry saved successfully! 🎉");
      setNote("");

      // Refresh mood history
      const updatedMoods = await axios.get(
        "http://localhost:5000/api/mood",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMoods(updatedMoods.data.moods);
    } catch (error) {
      console.error(error);

      if (axios.isAxiosError(error) && error.response) {
        setMessage(
          error.response.data?.message ||
            "Something went wrong while saving your mood."
        );
      } else {
        setMessage("Something went wrong while saving your mood.");
      }
    } finally {
      setLoading(false);
    }
  };

  console.log("Firebase user:", user);
  console.log("Firebase UID:", user?.uid);
  console.log("Firebase email:", user?.email);

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Please log in
            </h1>

            <p className="mt-3 text-slate-600">
              You need to be logged in to record and view your mood entries.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">

        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            MindTrack AI
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            How are you feeling today?
          </h1>

          <p className="mt-2 text-slate-600">
            Record your mood and energy so MindTrack AI can
            understand your wellbeing patterns.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >

          {/* Mood Score */}
          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-700">
              <span>Mood</span>

              <span className="text-indigo-600">
                {moodScore}/10
              </span>
            </label>

            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) =>
                setMoodScore(Number(e.target.value))
              }
              className="mt-4 w-full"
            />

            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>Very low</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Energy Score */}
          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-700">
              <span>Energy</span>

              <span className="text-indigo-600">
                {energyScore}/10
              </span>
            </label>

            <input
              type="range"
              min="1"
              max="10"
              value={energyScore}
              onChange={(e) =>
                setEnergyScore(Number(e.target.value))
              }
              className="mt-4 w-full"
            />

            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>Exhausted</span>
              <span>Very energetic</span>
            </div>
          </div>

          {/* Mood Type */}
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Mood type
            </label>

            <select
              value={moodType}
              onChange={(e) =>
                setMoodType(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
            >
              <option>Happy</option>
              <option>Calm</option>
              <option>Motivated</option>
              <option>Neutral</option>
              <option>Sad</option>
              <option>Stressed</option>
              <option>Angry</option>
              <option>Tired</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Note
            </label>

            <textarea
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              placeholder="How was your day? What affected your mood?"
              rows={5}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Mood"}
          </button>

          {/* Message */}
          {message && (
            <div className="rounded-xl bg-slate-50 p-4 text-center text-sm font-medium text-slate-700">
              {message}
            </div>
          )}

        </form>

        {/* Mood History */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Recent Mood Entries
          </h2>

          {loadingMoods ? (
            <p className="mt-4 text-sm text-slate-500">
              Loading your mood history...
            </p>
          ) : moods.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-slate-500">
                No mood entries yet.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {moods.map((mood) => (
                <div
                  key={mood.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">

                    <div>
                      <p className="font-semibold text-slate-900">
                        {mood.mood_type}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Energy: {mood.energy_score}/10
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">
                        {mood.mood_score}/10
                      </p>

                      <p className="text-xs text-slate-400">
                        {new Date(
                          mood.recorded_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                  </div>

                  {mood.note && (
                    <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                      {mood.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}