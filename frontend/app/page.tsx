import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
              M
            </div>

            <span className="text-xl font-bold tracking-tight">
              MindTrack AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            ✨ AI-Powered Student Wellbeing
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Understand your wellbeing.
            <span className="block text-indigo-600">
              Improve your productivity.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Track your mood, sleep, stress and focus in one place. Get
            personalised AI-powered insights that help you understand your
            habits and build healthier routines.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Start Your Journey
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              I Already Have an Account
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon="😊"
            title="Mood Tracking"
            description="Record how you feel and discover changes in your emotional wellbeing."
          />

          <FeatureCard
            icon="😴"
            title="Sleep Tracking"
            description="Monitor your sleep patterns and understand how they relate to your daily wellbeing."
          />

          <FeatureCard
            icon="🧠"
            title="Stress and Focus"
            description="Track stress and concentration to better understand your productivity."
          />

          <FeatureCard
            icon="✨"
            title="AI Insights"
            description="Receive personalised recommendations based on your wellbeing patterns."
          />
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Your wellbeing is part of your productivity.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Build awareness of your daily habits, understand your patterns,
            and make more informed decisions about your study and wellbeing.
          </p>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}