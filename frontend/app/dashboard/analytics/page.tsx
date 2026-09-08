"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { auth } from "@/lib/firebase";

type MoodEntry = {
  id?: number;
  mood_level: number;
  energy_level?: number;
  mood_date?: string;
  recorded_at?: string;
};

type SleepEntry = {
  id?: number;
  duration_hours: number;
  sleep_quality?: number;
  sleep_date?: string;
  recorded_at?: string;
};

type StressEntry = {
  id?: number;
  stress_level: number;
  stress_date?: string;
  recorded_at?: string;
};

type AIInsights = {
  overall: string;
  positive: string[];
  areasToImprove: string[];
  recommendations: string[];
};

type TrendResult = {
  direction: "Improving" | "Declining" | "Stable" | "Not enough data";
  change: number;
};

function extractArray<T>(responseData: unknown): T[] {
  if (Array.isArray(responseData)) {
    return responseData as T[];
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    const nestedData = (responseData as { data: unknown }).data;

    if (Array.isArray(nestedData)) {
      return nestedData as T[];
    }

    if (
      nestedData &&
      typeof nestedData === "object" &&
      "data" in nestedData
    ) {
      const deeplyNestedData = (nestedData as { data: unknown }).data;

      if (Array.isArray(deeplyNestedData)) {
        return deeplyNestedData as T[];
      }
    }
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "entries" in responseData
  ) {
    const entries = (responseData as { entries: unknown }).entries;

    if (Array.isArray(entries)) {
      return entries as T[];
    }
  }

  return [];
}

function calculateTrend(
  values: number[],
  lowerIsBetter: boolean = false
): TrendResult {
  if (values.length < 4) {
    return {
      direction: "Not enough data",
      change: 0,
    };
  }

  const midpoint = Math.floor(values.length / 2);

  const olderValues = values.slice(0, midpoint);
  const recentValues = values.slice(midpoint);

  const olderAverage =
    olderValues.reduce((sum, value) => sum + value, 0) /
    olderValues.length;

  const recentAverage =
    recentValues.reduce((sum, value) => sum + value, 0) /
    recentValues.length;

  const change = recentAverage - olderAverage;

  if (Math.abs(change) < 0.4) {
    return {
      direction: "Stable",
      change,
    };
  }

  if (lowerIsBetter) {
    return {
      direction: change < 0 ? "Improving" : "Declining",
      change,
    };
  }

  return {
    direction: change > 0 ? "Improving" : "Declining",
    change,
  };
}

function formatTrend(trend: TrendResult): string {
  if (trend.direction === "Not enough data") {
    return "Not enough data";
  }

  const sign = trend.change > 0 ? "+" : "";

  return trend.direction + " (" + sign + trend.change.toFixed(1) + ")";
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>

      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>

      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function InsightCard({
  title,
  text,
  trend,
}: {
  title: string;
  text: string;
  trend: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {trend}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-gray-600">{text}</p>
    </div>
  );
}

function ChartSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="h-[320px]">{children}</div>
    </section>
  );
}

function LoadingChart() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-gray-500">Loading analytics...</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-gray-500">
        Not enough data to display this chart yet.
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [stressEntries, setStressEntries] = useState<StressEntry[]>([]);

  const [loading, setLoading] = useState(true);

  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);

        const token = await user.getIdToken();

        const headers = {
          Authorization: "Bearer " + token,
        };

        const results = await Promise.all([
          axios.get("http://localhost:5000/api/mood", { headers }),
          axios.get("http://localhost:5000/api/sleep", { headers }),
          axios.get("http://localhost:5000/api/stress", { headers }),
        ]);

        const moods = extractArray<MoodEntry>(results[0].data);
        const sleeps = extractArray<SleepEntry>(results[1].data);
        const stresses = extractArray<StressEntry>(results[2].data);

        setMoodEntries(moods);
        setSleepEntries(sleeps);
        setStressEntries(stresses);
      } catch (error) {
        console.error("Analytics API Error:", error);

        setMoodEntries([]);
        setSleepEntries([]);
        setStressEntries([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const sortedMoodEntries = useMemo(() => {
    return [...moodEntries].sort((a, b) => {
      const dateA = new Date(
        a.mood_date || a.recorded_at || ""
      ).getTime();

      const dateB = new Date(
        b.mood_date || b.recorded_at || ""
      ).getTime();

      return dateA - dateB;
    });
  }, [moodEntries]);

  const sortedSleepEntries = useMemo(() => {
    return [...sleepEntries].sort((a, b) => {
      const dateA = new Date(
        a.sleep_date || a.recorded_at || ""
      ).getTime();

      const dateB = new Date(
        b.sleep_date || b.recorded_at || ""
      ).getTime();

      return dateA - dateB;
    });
  }, [sleepEntries]);

  const sortedStressEntries = useMemo(() => {
    return [...stressEntries].sort((a, b) => {
      const dateA = new Date(
        a.stress_date || a.recorded_at || ""
      ).getTime();

      const dateB = new Date(
        b.stress_date || b.recorded_at || ""
      ).getTime();

      return dateA - dateB;
    });
  }, [stressEntries]);

  const averageMood = useMemo(() => {
    if (!moodEntries.length) return 0;

    return (
      moodEntries.reduce(
        (sum, item) => sum + Number(item.mood_level || 0),
        0
      ) / moodEntries.length
    );
  }, [moodEntries]);

  const averageEnergy = useMemo(() => {
    const entriesWithEnergy = moodEntries.filter(
      (item) => item.energy_level !== undefined
    );

    if (!entriesWithEnergy.length) return 0;

    return (
      entriesWithEnergy.reduce(
        (sum, item) => sum + Number(item.energy_level || 0),
        0
      ) / entriesWithEnergy.length
    );
  }, [moodEntries]);

  const averageSleep = useMemo(() => {
    if (!sleepEntries.length) return 0;

    return (
      sleepEntries.reduce(
        (sum, item) => sum + Number(item.duration_hours || 0),
        0
      ) / sleepEntries.length
    );
  }, [sleepEntries]);

  const averageStress = useMemo(() => {
    if (!stressEntries.length) return 0;

    return (
      stressEntries.reduce(
        (sum, item) => sum + Number(item.stress_level || 0),
        0
      ) / stressEntries.length
    );
  }, [stressEntries]);

  const moodTrend = useMemo(() => {
    return calculateTrend(
      sortedMoodEntries.map((item) => Number(item.mood_level || 0))
    );
  }, [sortedMoodEntries]);

  const energyTrend = useMemo(() => {
    return calculateTrend(
      sortedMoodEntries
        .filter((item) => item.energy_level !== undefined)
        .map((item) => Number(item.energy_level || 0))
    );
  }, [sortedMoodEntries]);

  const sleepTrend = useMemo(() => {
    return calculateTrend(
      sortedSleepEntries.map((item) => Number(item.duration_hours || 0))
    );
  }, [sortedSleepEntries]);

  const stressTrend = useMemo(() => {
    return calculateTrend(
      sortedStressEntries.map((item) => Number(item.stress_level || 0)),
      true
    );
  }, [sortedStressEntries]);

  const moodChartData = useMemo(() => {
    return sortedMoodEntries.map((item) => ({
      date: new Date(
        item.mood_date || item.recorded_at || ""
      ).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      mood: Number(item.mood_level || 0),
      energy:
        item.energy_level !== undefined
          ? Number(item.energy_level || 0)
          : null,
    }));
  }, [sortedMoodEntries]);

  const sleepChartData = useMemo(() => {
    return sortedSleepEntries.map((item) => ({
      date: new Date(
        item.sleep_date || item.recorded_at || ""
      ).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      duration: Number(item.duration_hours || 0),
      quality:
        item.sleep_quality !== undefined
          ? Number(item.sleep_quality || 0)
          : null,
    }));
  }, [sortedSleepEntries]);

  const stressChartData = useMemo(() => {
    return sortedStressEntries.map((item) => ({
      date: new Date(
        item.stress_date || item.recorded_at || ""
      ).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      stress: Number(item.stress_level || 0),
    }));
  }, [sortedStressEntries]);

  const moodInsight = useMemo(() => {
    if (!moodEntries.length) {
      return "Start recording your mood to identify patterns over time.";
    }

    if (averageMood >= 7) {
      return "Your recorded mood is generally positive. Keep noticing the activities and routines that support this.";
    }

    if (averageMood >= 5) {
      return "Your mood is moderately positive. Tracking your daily patterns can help identify what improves your wellbeing.";
    }

    return "Your mood scores suggest there may be room for improvement. Consistent tracking can help identify useful patterns.";
  }, [averageMood, moodEntries.length]);

  const energyInsight = useMemo(() => {
    if (!moodEntries.some((item) => item.energy_level !== undefined)) {
      return "Record energy levels alongside your mood to understand your daily wellbeing patterns.";
    }

    if (averageEnergy >= 7) {
      return "Your average energy level is high, suggesting that your current routines are supporting your day-to-day energy.";
    }

    if (averageEnergy >= 5) {
      return "Your energy levels are moderate. Sleep, routines and workload may be useful areas to monitor.";
    }

    return "Your recorded energy levels are relatively low. Look for patterns between energy, sleep and stress.";
  }, [averageEnergy, moodEntries]);

  const sleepInsight = useMemo(() => {
    if (!sleepEntries.length) {
      return "Start recording your sleep to understand how your sleep routine relates to wellbeing.";
    }

    if (averageSleep >= 7) {
      return "Your average sleep duration is within a generally healthy range. Maintaining consistency may help support wellbeing.";
    }

    if (averageSleep >= 5) {
      return "Your average sleep duration is below the commonly recommended range. Improving consistency could support your wellbeing.";
    }

    return "Your recorded sleep duration is quite low. Consider reviewing your sleep routine and workload.";
  }, [averageSleep, sleepEntries.length]);

  const stressInsight = useMemo(() => {
    if (!stressEntries.length) {
      return "Start recording stress levels to identify triggers and patterns.";
    }

    if (averageStress <= 3) {
      return "Your average stress level is relatively low. Continue monitoring what routines help you maintain this.";
    }

    if (averageStress <= 6) {
      return "Your average stress level is moderate. Tracking triggers may help identify opportunities to reduce pressure.";
    }

    return "Your average stress level is relatively high. Reviewing stress triggers and recovery habits may be useful.";
  }, [averageStress, stressEntries.length]);

  const generateAIInsights = async () => {
    try {
      setAiLoading(true);
      setAiError("");

      const user = auth.currentUser;

      if (!user) {
        setAiError("Please log in again.");
        return;
      }

      const token = await user.getIdToken();

      const headers = {
        Authorization: "Bearer " + token,
      };

      const response = await axios.post(
        "http://localhost:5000/api/ai-insights",
        {
          mood: moodEntries,
          sleep: sleepEntries,
          stress: stressEntries,
        },
        {
          headers,
        }
      );

      const returnedInsights = response.data?.insights;

      if (!returnedInsights) {
        throw new Error("No AI insights were returned.");
      }

      setAiInsights(returnedInsights);
    } catch (error) {
      console.error("AI Insights Error:", error);

      if (axios.isAxiosError(error)) {
        setAiError(
          error.response?.data?.error ||
            "Unable to generate AI insights. Please try again."
        );
      } else {
        setAiError("Unable to generate AI insights. Please try again.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              MindTrack AI
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Wellbeing Analytics
            </h1>

            <p className="mt-2 text-gray-600">
              Understand your wellbeing patterns across mood, sleep and stress.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Back to Dashboard
          </button>
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Wellbeing Summary
          </h2>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Loading your wellbeing summary...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Average Mood"
                value={averageMood ? averageMood.toFixed(1) + "/10" : "—"}
                subtitle={
                  moodEntries.length
                    ? moodEntries.length + " recorded entries"
                    : "No mood data yet"
                }
              />

              <SummaryCard
                title="Average Energy"
                value={
                  averageEnergy ? averageEnergy.toFixed(1) + "/10" : "—"
                }
                subtitle="Based on recorded energy levels"
              />

              <SummaryCard
                title="Average Sleep"
                value={
                  averageSleep ? averageSleep.toFixed(1) + "h" : "—"
                }
                subtitle={
                  sleepEntries.length
                    ? sleepEntries.length + " recorded nights"
                    : "No sleep data yet"
                }
              />

              <SummaryCard
                title="Average Stress"
                value={
                  averageStress ? averageStress.toFixed(1) + "/10" : "—"
                }
                subtitle={
                  stressEntries.length
                    ? stressEntries.length + " recorded entries"
                    : "No stress data yet"
                }
              />
            </div>
          )}
        </section>

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Key Insights
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Automatically identified patterns from your wellbeing records.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Analysing your data...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <InsightCard
                title="Mood"
                text={moodInsight}
                trend={"Trend: " + formatTrend(moodTrend)}
              />

              <InsightCard
                title="Energy"
                text={energyInsight}
                trend={"Trend: " + formatTrend(energyTrend)}
              />

              <InsightCard
                title="Sleep"
                text={sleepInsight}
                trend={"Trend: " + formatTrend(sleepTrend)}
              />

              <InsightCard
                title="Stress"
                text={stressInsight}
                trend={"Trend: " + formatTrend(stressTrend)}
              />
            </div>
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                AI-Powered Analysis
              </p>

              <h2 className="mt-1 text-xl font-semibold text-gray-900">
                AI Wellbeing Insights
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                MindTrack AI analyses your recorded mood, sleep and stress
                patterns and provides supportive recommendations.
              </p>
            </div>

            <button
              onClick={generateAIInsights}
              disabled={
                aiLoading ||
                loading ||
                (!moodEntries.length &&
                  !sleepEntries.length &&
                  !stressEntries.length)
              }
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading
                ? "Generating..."
                : aiInsights
                  ? "Regenerate Insights"
                  : "Generate AI Insights"}
            </button>
          </div>

          {aiError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {aiError}
            </div>
          )}

          {aiInsights && !aiLoading && (
            <div className="mt-6 space-y-5">
              <div className="rounded-xl bg-gray-50 p-5">
                <h3 className="font-semibold text-gray-900">
                  Overall Wellbeing
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {aiInsights.overall}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900">
                    Positive Patterns
                  </h3>

                  <ul className="mt-3 space-y-2">
                    {aiInsights.positive.map((item, index) => (
                      <li
                        key={index}
                        className="text-sm leading-6 text-gray-600"
                      >
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900">
                    Areas to Improve
                  </h3>

                  <ul className="mt-3 space-y-2">
                    {aiInsights.areasToImprove.map((item, index) => (
                      <li
                        key={index}
                        className="text-sm leading-6 text-gray-600"
                      >
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900">
                    Recommendations
                  </h3>

                  <ul className="mt-3 space-y-2">
                    {aiInsights.recommendations.map((item, index) => (
                      <li
                        key={index}
                        className="text-sm leading-6 text-gray-600"
                      >
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <ChartSection
            title="Mood & Energy Trends"
            description="Track how your mood and energy have changed over time."
          >
            {loading ? (
              <LoadingChart />
            ) : moodChartData.length < 2 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={moodChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="date" />

                  <YAxis domain={[0, 10]} />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="mood"
                    name="Mood"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartSection>

          <ChartSection
            title="Sleep Duration & Quality"
            description="See how your sleep duration and recorded sleep quality change over time."
          >
            {loading ? (
              <LoadingChart />
            ) : sleepChartData.length < 2 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sleepChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="date" />

                  <YAxis domain={[0, 12]} />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="duration"
                    name="Sleep Duration"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="quality"
                    name="Sleep Quality"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartSection>

          <ChartSection
            title="Stress Level Trend"
            description="Monitor how your recorded stress levels have changed over time."
          >
            {loading ? (
              <LoadingChart />
            ) : stressChartData.length < 2 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stressChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="date" />

                  <YAxis domain={[0, 10]} />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="stress"
                    name="Stress"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartSection>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Analytics Categories
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={() => router.push("/dashboard/mood")}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">Mood Tracking</h3>

              <p className="mt-2 text-sm text-gray-500">
                Record and review your daily mood and energy levels.
              </p>
            </button>

            <button
              onClick={() => router.push("/dashboard/sleep")}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">Sleep Tracking</h3>

              <p className="mt-2 text-sm text-gray-500">
                Monitor sleep duration and sleep quality.
              </p>
            </button>

            <button
              onClick={() => router.push("/dashboard/stress")}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">Stress Tracking</h3>

              <p className="mt-2 text-sm text-gray-500">
                Record stress levels and identify possible triggers.
              </p>
            </button>

            <button
              onClick={() => router.push("/dashboard/ai-insights")}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">AI Insights</h3>

              <p className="mt-2 text-sm text-gray-500">
                Get personalised wellbeing insights and recommendations.
              </p>
            </button>

            <button
              onClick={() => router.push("/dashboard/journal")}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">Journal</h3>

              <p className="mt-2 text-sm text-gray-500">
                Reflect on your thoughts and experiences.
              </p>
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">Dashboard</h3>

              <p className="mt-2 text-sm text-gray-500">
                Return to your main wellbeing dashboard.
              </p>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}