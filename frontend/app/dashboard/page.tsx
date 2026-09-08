"use client";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { auth } from "@/lib/firebase";

type MoodEntry = {
  id: number;
  mood_score: number;
  mood_type: string;
  energy_score: number | null;
  note: string | null;
  recorded_at: string;
};

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

type StressEntry = {
  id: number;
  stress_date: string;
  stress_level: number;
  trigger: string | null;
  note: string | null;
  recorded_at: string;
};

function getStressLabel(level: number) {
  if (level <= 2) return "Very low";
  if (level <= 4) return "Low";
  if (level <= 6) return "Moderate";
  if (level <= 8) return "High";
  return "Very high";
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [latestMood, setLatestMood] = useState<MoodEntry | null>(null);
  const [loadingMood, setLoadingMood] = useState(true);

  const [latestSleep, setLatestSleep] = useState<SleepEntry | null>(null);
  const [loadingSleep, setLoadingSleep] = useState(true);

  const [latestStress, setLatestStress] = useState<StressEntry | null>(null);
  const [loadingStress, setLoadingStress] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchLatestMood = async () => {
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

        const moods: MoodEntry[] = response.data.moods || [];

        if (moods.length > 0) {
          setLatestMood(moods[0]);
        } else {
          setLatestMood(null);
        }
      } catch (error) {
        console.error("Error loading dashboard mood:", error);
      } finally {
        setLoadingMood(false);
      }
    };

    fetchLatestMood();
  }, [user]);

  useEffect(() => {
  const fetchLatestSleep = async () => {
    if (!user) {
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await axios.get(
        "http://localhost:5000/api/sleep",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const sleeps: SleepEntry[] = response.data;

      if (sleeps.length > 0) {
        setLatestSleep(sleeps[0]);
      } else {
        setLatestSleep(null);
      }
    } catch (error) {
      console.error("Error loading dashboard sleep:", error);
    } finally {
      setLoadingSleep(false);
    }
  };

  fetchLatestSleep();
}, [user]);

useEffect(() => {
  const fetchLatestStress = async () => {
    if (!user) {
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await axios.get(
        "http://localhost:5000/api/stress",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const stresses: StressEntry[] = response.data;

      if (stresses.length > 0) {
        setLatestStress(stresses[0]);
      } else {
        setLatestStress(null);
      }
    } catch (error) {
      console.error("Error loading dashboard stress:", error);
    } finally {
      setLoadingStress(false);
    }
  };

  fetchLatestStress();
}, [user]);



  async function handleLogout() {
    try {
      setLoggingOut(true);

      await signOut(auth);

      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
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

      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>
            <p className="text-lg font-bold text-slate-900">
              MindTrack AI
            </p>

            <p className="text-xs text-slate-500">
              Student Wellbeing & Productivity
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Signing out..." : "Sign Out"}
          </button>

        </div>
      </nav>

      {/* Dashboard */}
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Welcome */}
        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {user.displayName || "Student"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {user.email}
          </p>
        </div>

        {/* Overview cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          <DashboardCard
            title="Mood"
            value={
              loadingMood
                ? "..."
                : latestMood
                ? `${latestMood.mood_score}/10`
                : "—"
            }
            description={
              loadingMood
                ? "Loading..."
                : latestMood
                ? `${latestMood.mood_type} • Latest entry`
                : "No entries yet"
            }
          />

          <DashboardCard
            title="Energy"
            value={
              loadingMood
                ? "..."
                : latestMood?.energy_score
                ? `${latestMood.energy_score}/10`
                : "—"
            }
            description={
              latestMood
                ? "Latest energy level"
                : "No entries yet"
            }
          />

          <DashboardCard
  title="Sleep"
  value={
    loadingSleep
      ? "..."
      : latestSleep
      ? `${latestSleep.duration_hours} hrs`
      : "—"
  }
  description={
    loadingSleep
      ? "Loading..."
      : latestSleep
      ? latestSleep.sleep_quality
        ? `Quality ${latestSleep.sleep_quality}/10 • Latest entry`
        : "Latest sleep entry"
      : "No entries yet"
  }
/>

          <DashboardCard
  title="Stress"
  value={
    loadingStress
      ? "..."
      : latestStress
      ? `${latestStress.stress_level}/10`
      : "—"
  }
  description={
    loadingStress
      ? "Loading..."
      : latestStress
      ? `${getStressLabel(latestStress.stress_level)} • Latest entry`
      : "No entries yet"
  }
/>

        </div>

        {/* Latest mood */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <p className="text-sm font-semibold text-indigo-600">
                Latest wellbeing update
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {latestMood
                  ? `You're feeling ${latestMood.mood_type.toLowerCase()}`
                  : "Start tracking your wellbeing"}
              </h2>

              <p className="mt-2 text-slate-600">
                {latestMood
                  ? `Your latest mood score is ${latestMood.mood_score}/10.`
                  : "Record your first mood entry to start building your wellbeing history."}
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard/mood")}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {latestMood ? "Update Mood" : "Log Mood"}
            </button>

          </div>

          {latestMood && (
            <div className="mt-6 border-t border-slate-100 pt-6">

              <div className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Mood
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {latestMood.mood_score}/10
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Energy
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {latestMood.energy_score
                      ? `${latestMood.energy_score}/10`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Recorded
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {new Date(
                      latestMood.recorded_at
                    ).toLocaleDateString()}
                  </p>
                </div>

              </div>

              {latestMood.note && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Note
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {latestMood.note}
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Getting started */}
        <div className="mt-8">

          <p className="text-sm font-semibold text-indigo-600">
            Track your wellbeing
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Your wellbeing tools
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Record different aspects of your wellbeing regularly.
            As more data is collected, MindTrack AI will be able to
            identify patterns and provide personalised insights.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <FeatureButton
              icon="😊"
              title="Log Mood"
              onClick={() => router.push("/dashboard/mood")}
            />

            <FeatureButton
              icon="😴"
              title="Track Sleep"
              onClick={() => router.push("/dashboard/sleep")}
            />

            <FeatureButton
              icon="🧠"
              title="Record Stress"
              onClick={() => router.push("/dashboard/stress")}
            />

            <FeatureButton
              icon="🎯"
              title="Track Focus"
              onClick={() => router.push("/dashboard/analytics")}
            />

          </div>

        </div>

        {/* AI Insights placeholder */}
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-8">

          <p className="text-sm font-semibold text-indigo-600">
            AI Insights
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Personalised insights are coming soon
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Once enough wellbeing data has been collected, MindTrack AI
            will analyse your patterns and provide personalised
            recommendations to support your study routine and wellbeing.
          </p>

        </div>

      </div>
    </main>
  );
}


function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

function FeatureButton({
  icon,
  title,
  onClick,
}: {
  icon: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
    >
      <div className="text-2xl">
        {icon}
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-900">
        {title}
      </p>
    </button>
  );
}