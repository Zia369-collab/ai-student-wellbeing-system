"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import axios from "axios";
import { auth } from "@/lib/firebase";
import Link from "next/link";

type SleepEntry = {
  id: number;
  sleep_date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_hours: number;
  sleep_quality: number | null;
  note: string | null;
  recorded_at: string;
};

export default function SleepPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [sleepDate, setSleepDate] = useState("");
  const [bedtime, setBedtime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");
  const [note, setNote] = useState("");

  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadSleepEntries();
    }
  }, [user]);

  async function loadSleepEntries() {
    try {
      setLoadingEntries(true);
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await axios.get(
        "http://localhost:5000/api/sleep",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEntries(response.data);
    } catch (error) {
      console.error("Error loading sleep entries:", error);
      setError("Unable to load your sleep records.");
    } finally {
      setLoadingEntries(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!sleepDate) {
      setError("Please select a sleep date.");
      return;
    }

    if (!durationHours) {
      setError("Please enter your sleep duration.");
      return;
    }

    const duration = Number(durationHours);

    if (duration <= 0 || duration > 24) {
      setError("Sleep duration must be between 0 and 24 hours.");
      return;
    }

    if (
      sleepQuality &&
      (Number(sleepQuality) < 1 || Number(sleepQuality) > 5)
    ) {
      setError("Sleep quality must be between 1 and 5.");
      return;
    }

    try {
      setSaving(true);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("You are not logged in.");
        return;
      }

      const token = await currentUser.getIdToken();

      await axios.post(
        "http://localhost:5000/api/sleep",
        {
          sleep_date: sleepDate,
          bedtime: bedtime
            ? `${sleepDate}T${bedtime}:00`
            : null,
          wake_time: wakeTime
            ? `${sleepDate}T${wakeTime}:00`
            : null,
          duration_hours: duration,
          sleep_quality: sleepQuality
            ? Number(sleepQuality)
            : null,
          note: note.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Sleep record saved successfully.");

      setBedtime("");
      setWakeTime("");
      setDurationHours("");
      setSleepQuality("");
      setNote("");

      await loadSleepEntries();
    } catch (error) {
      console.error("Error saving sleep entry:", error);

      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ||
            "Unable to save your sleep record."
        );
      } else {
        setError("Unable to save your sleep record.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-600">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-bold text-slate-900">
              MindTrack AI
            </p>
            <p className="text-xs text-slate-500">
              Student Wellbeing & Productivity
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Sleep Tracking
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Track your sleep
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Record your sleep patterns and monitor your sleep quality over time.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Record sleep
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add your latest sleep information.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Sleep date
                </label>

                <input
                  type="date"
                  value={sleepDate}
                  onChange={(e) => setSleepDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Bedtime
                  </label>

                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Wake-up time
                  </label>

                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Sleep duration (hours)
                </label>

                <input
                  type="number"
                  min="0.1"
                  max="24"
                  step="0.1"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Sleep quality
                </label>

                <select
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select quality</option>
                  <option value="1">1 — Very poor</option>
                  <option value="2">2 — Poor</option>
                  <option value="3">3 — Average</option>
                  <option value="4">4 — Good</option>
                  <option value="5">5 — Excellent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Note
                </label>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="How did you sleep?"
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Sleep Record"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Sleep history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your previous sleep records.
            </p>

            {loadingEntries ? (
              <div className="mt-8 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                <p className="mt-3 text-sm text-slate-500">
                  Loading your records...
                </p>
              </div>
            ) : entries.length === 0 ? (
              <div className="mt-8 rounded-xl bg-slate-50 p-6 text-center">
                <div className="text-4xl">😴</div>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No sleep records yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Add your first sleep record using the form.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">
                        {entry.sleep_date}
                      </p>

                      <p className="text-lg font-bold text-indigo-600">
                        {Number(entry.duration_hours).toFixed(1)}h
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">
                          Bedtime
                        </p>
                        <p className="mt-1 text-slate-700">
                          {entry.bedtime
                            ? new Date(entry.bedtime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Not recorded"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Wake-up
                        </p>
                        <p className="mt-1 text-slate-700">
                          {entry.wake_time
                            ? new Date(entry.wake_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Not recorded"}
                        </p>
                      </div>
                    </div>

                    {entry.sleep_quality && (
                      <p className="mt-3 text-sm text-slate-600">
                        Quality:{" "}
                        <span className="font-semibold">
                          {entry.sleep_quality}/5
                        </span>
                      </p>
                    )}

                    {entry.note && (
                      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        {entry.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}