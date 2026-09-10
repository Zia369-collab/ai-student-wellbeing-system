"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import axios from "axios";
import { auth } from "@/lib/firebase";
import Link from "next/link";

type StressEntry = {
  id: number;
  stress_date: string;
  stress_level: number;
  trigger: string | null;
  note: string | null;
  recorded_at: string;
};

const MAX_NOTE_LENGTH = 500;

const stressLevels = [
  {
    value: 1,
    label: "Very low",
    description: "Feeling calm and relaxed",
  },
  {
    value: 2,
    label: "Very low",
    description: "Feeling mostly calm",
  },
  {
    value: 3,
    label: "Low",
    description: "A little stressed",
  },
  {
    value: 4,
    label: "Low",
    description: "Some noticeable stress",
  },
  {
    value: 5,
    label: "Moderate",
    description: "A manageable level of stress",
  },
  {
    value: 6,
    label: "Moderate",
    description: "Feeling noticeably stressed",
  },
  {
    value: 7,
    label: "High",
    description: "Feeling quite stressed",
  },
  {
    value: 8,
    label: "High",
    description: "Stress is affecting your day",
  },
  {
    value: 9,
    label: "Very high",
    description: "Feeling extremely stressed",
  },
  {
    value: 10,
    label: "Very high",
    description: "Feeling overwhelmed",
  },
];

const triggerOptions = [
  "University / studying",
  "Exams / assignments",
  "Work",
  "Finances",
  "Relationships",
  "Family",
  "Sleep",
  "Health",
  "Time management",
  "Other",
];

export default function StressPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [stressDate, setStressDate] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [trigger, setTrigger] = useState("");
  const [customTrigger, setCustomTrigger] = useState("");
  const [note, setNote] = useState("");

  const [entries, setEntries] = useState<StressEntry[]>([]);
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
      loadStressEntries();
    }
  }, [user]);

  async function loadStressEntries() {
    try {
      setLoadingEntries(true);
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await axios.get(
        "http://localhost:5000/api/stress",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEntries(response.data);
    } catch (error) {
      console.error("Error loading stress entries:", error);
      setError("Unable to load your stress records.");
    } finally {
      setLoadingEntries(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!stressDate) {
      setError("Please select a date.");
      return;
    }

    if (!stressLevel) {
      setError("Please select your stress level.");
      return;
    }

    const level = Number(stressLevel);

    if (!Number.isInteger(level) || level < 1 || level > 10) {
      setError("Stress level must be between 1 and 10.");
      return;
    }

    if (note.trim().length > MAX_NOTE_LENGTH) {
      setError(`Your note must be ${MAX_NOTE_LENGTH} characters or fewer.`);
      return;
    }

    if (trigger === "Other" && !customTrigger.trim()) {
      setError("Please enter your stress trigger.");
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

      const finalTrigger =
        trigger === "Other"
          ? customTrigger.trim()
          : trigger.trim();

      await axios.post(
        "http://localhost:5000/api/stress",
        {
          stress_date: stressDate,
          stress_level: level,
          trigger: finalTrigger || null,
          note: note.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Stress record saved successfully.");

      setStressLevel("");
      setTrigger("");
      setCustomTrigger("");
      setNote("");

      await loadStressEntries();
    } catch (error) {
      console.error("Error saving stress entry:", error);

      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ||
            "Unable to save your stress record."
        );
      } else {
        setError("Unable to save your stress record.");
      }
    } finally {
      setSaving(false);
    }
  }

  function getStressLabel(level: number) {
    if (level <= 2) return "Very low";
    if (level <= 4) return "Low";
    if (level <= 6) return "Moderate";
    if (level <= 8) return "High";
    return "Very high";
  }

  function getStressDescription(level: number) {
    if (level <= 2) return "Feeling calm and relaxed";
    if (level <= 4) return "A little stress";
    if (level <= 6) return "A manageable level of stress";
    if (level <= 8) return "Feeling quite stressed";
    return "Feeling extremely stressed";
  }

  function getStressBadgeClasses(level: number) {
    if (level <= 2) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (level <= 4) {
      return "border-lime-200 bg-lime-50 text-lime-700";
    }

    if (level <= 6) {
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    }

    if (level <= 8) {
      return "border-orange-200 bg-orange-50 text-orange-700";
    }

    return "border-red-200 bg-red-50 text-red-700";
  }

  function getStressNumberClasses(level: number) {
    if (level <= 2) return "text-green-600";
    if (level <= 4) return "text-lime-600";
    if (level <= 6) return "text-yellow-600";
    if (level <= 8) return "text-orange-600";
    return "text-red-600";
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

  const selectedLevel = stressLevels.find(
    (level) => String(level.value) === stressLevel
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navigation */}
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
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Stress Tracking
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Track your stress
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Record your stress levels and identify possible triggers over
            time.
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Record Stress */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Record stress
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              How are you feeling today?
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Date */}
              <div>
                <label
                  htmlFor="stress-date"
                  className="block text-sm font-medium text-slate-700"
                >
                  Date
                </label>

                <input
                  id="stress-date"
                  type="date"
                  value={stressDate}
                  onChange={(e) => setStressDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Stress Level */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Stress level
                  </label>

                  <span className="text-xs text-slate-400">
                    1 = lowest · 10 = highest
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-5 gap-2">
                  {stressLevels.map((level) => {
                    const isSelected =
                      stressLevel === String(level.value);

                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() =>
                          setStressLevel(String(level.value))
                        }
                        className={`rounded-lg border px-2 py-3 text-center transition ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        <span className="block text-lg font-bold">
                          {level.value}
                        </span>

                        <span
                          className={`block text-[10px] ${
                            isSelected
                              ? "text-indigo-100"
                              : "text-slate-500"
                          }`}
                        >
                          {level.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedLevel && (
                  <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <p className="text-sm font-semibold text-indigo-900">
                      {selectedLevel.value}/10 — {selectedLevel.label}
                    </p>

                    <p className="mt-1 text-xs text-indigo-700">
                      {selectedLevel.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Trigger */}
              <div>
                <label
                  htmlFor="stress-trigger"
                  className="block text-sm font-medium text-slate-700"
                >
                  Reason
                </label>

                <select
  id="stress-trigger"
  value={trigger}
  onChange={(e) => setTrigger(e.target.value)}
  className={`mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
    trigger ? "text-slate-900" : "text-slate-400"
  }`}
>
  <option value="" disabled>
    Select a possible reason
  </option>

  {triggerOptions.map((option) => (
    <option key={option} value={option}>
      {option}
    </option>
  ))}
</select>


                {trigger === "Other" && (
                  <input
                    type="text"
                    value={customTrigger}
                    onChange={(e) => setCustomTrigger(e.target.value)}
                    maxLength={100}
                    placeholder="Enter your stress trigger"
                    className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                )}
              </div>

              {/* Note */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="stress-note"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Note
                  </label>

                  <span
                    className={`text-xs ${
                      note.length >= MAX_NOTE_LENGTH
                        ? "font-medium text-red-600"
                        : "text-slate-400"
                    }`}
                  >
                    {note.length}/{MAX_NOTE_LENGTH}
                  </span>
                </div>

                <textarea
                  id="stress-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder="Tell us more about how you're feeling..."
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Stress Record"}
              </button>
            </form>
          </section>

          {/* Stress History */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Stress history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your previous stress records.
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
                <div className="text-4xl">🧠</div>

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No stress records yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Add your first stress record using the form.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {new Date(entry.stress_date).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
})}
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStressBadgeClasses(
                            entry.stress_level
                          )}`}
                        >
                          {getStressLabel(entry.stress_level)}
                        </span>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-3xl font-bold ${getStressNumberClasses(
                            entry.stress_level
                          )}`}
                        >
                          {entry.stress_level}
                        </p>

                        <p className="text-xs text-slate-400">
                          / 10
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      {getStressDescription(entry.stress_level)}
                    </p>

                    {entry.trigger && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-slate-400">
                          Possible trigger
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {entry.trigger}
                        </p>
                      </div>
                    )}

                    {entry.note && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="text-sm leading-6 text-slate-600">
                          {entry.note}
                        </p>
                      </div>
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