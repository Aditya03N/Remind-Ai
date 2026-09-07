"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetchWithAuth("/progress/dashboard");
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
      setLoading(false);
    };

    if (user) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (authLoading || loading)
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-surface-container-low rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 bg-surface-container-low rounded-xl"></div>
          <div className="h-32 bg-surface-container-low rounded-xl"></div>
          <div className="h-32 bg-surface-container-low rounded-xl"></div>
          <div className="h-32 bg-surface-container-low rounded-xl"></div>
        </div>
        <div className="h-64 bg-surface-container-low rounded-xl"></div>
      </div>
    );
  if (!user) return null;

  const healthScore = dashboardData?.overallHealth ?? 0;
  const healthTrend = dashboardData?.healthTrend || [];
  const knowledge = dashboardData?.knowledgeOverview || {};
  const stats = {
    strong: knowledge.STRONG || 0,
    atRisk: (knowledge.MODERATE_RISK || 0) + (knowledge.HIGH_RISK || 0),
    critical: knowledge.CRITICAL || 0,
    mastered: knowledge.MASTERED || 0,
  };
  const activeConcepts =
    stats.strong + stats.atRisk + stats.critical + stats.mastered;
  const immediateFocus = dashboardData?.todayPriority;
  const revisionPlan = dashboardData?.revisionPlan || [];
  const dueManualReminders = dashboardData?.dueManualReminders || [];

  return (
    <>
      {dueManualReminders.length > 0 && (
        <section className="mb-6">
          <div className="bg-error-container text-on-error-container p-6 rounded-2xl shadow-lg border border-error/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-error text-on-error flex items-center justify-center shadow-md animate-pulse">
                <span className="material-symbols-outlined text-2xl">
                  alarm
                </span>
              </div>
              <div>
                <h3
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-headline-sm)" }}
                >
                  Manual Reminders Due!
                </h3>
                <p className="text-sm opacity-90 mt-1">
                  You have {dueManualReminders.length} scheduled revision
                  {dueManualReminders.length > 1 ? "s" : ""} waiting for you
                  right now.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {dueManualReminders.map((reminder, idx) => (
                <Link
                  key={idx}
                  href={`/retention-check/${reminder.concept?._id}`}
                  className="px-5 py-2.5 bg-error text-on-error hover:bg-error/90 text-sm font-medium rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Revise {reminder.concept?.name}</span>
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Section: Overall Knowledge Health & Quick Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Knowledge Health Card */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col md:flex-row gap-8 items-center h-full">
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform -rotate-90"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--outline-variant)"
                strokeWidth="8"
                opacity="0.2"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--primary)"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                className="transition-all duration-1000 ease-out drop-shadow-md"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-3xl font-extrabold text-on-surface"
                style={{ fontFamily: "var(--font-headline-lg)" }}
              >
                {Math.round(healthScore)}
              </span>
              <span className="text-xs font-bold text-primary tracking-wider uppercase">
                Score
              </span>
            </div>
          </div>

          <div className="flex-1 w-full h-48">
            <h3 className="text-sm font-bold text-on-surface-variant mb-4">
              7-Day Knowledge Retention Trend
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--outline-variant)"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--on-surface-variant)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis domain={[0, 100]} hide={true} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface-container-high)",
                    border: "none",
                    borderRadius: "8px",
                    color: "var(--on-surface)",
                  }}
                  itemStyle={{ color: "var(--primary)", fontWeight: "bold" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--primary)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Knowledge Overview: Four Small Summary Tiles */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/revision"
            className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-0.5">
                Stable
                <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </span>
            </div>
            <div className="mt-4">
              <span
                className="text-2xl font-bold text-on-surface"
                style={{ fontFamily: "var(--font-headline-md)" }}
              >
                {stats.strong}
              </span>
              <p className="text-xs text-on-surface-variant mt-0.5">Strong</p>
            </div>
          </Link>

          <Link
            href="/revision"
            className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">
                  schedule
                </span>
              </div>
              <span className="text-xs text-amber-700 font-medium flex items-center gap-0.5">
                Fading
                <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </span>
            </div>
            <div className="mt-4">
              <span
                className="text-2xl font-bold text-on-surface"
                style={{ fontFamily: "var(--font-headline-md)" }}
              >
                {stats.atRisk}
              </span>
              <p className="text-xs text-on-surface-variant mt-0.5">At Risk</p>
            </div>
          </Link>

          <Link
            href="/revision"
            className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between hover:border-error/50 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">
                  warning
                </span>
              </div>
              <span className="text-xs text-error font-medium flex items-center gap-0.5">
                Urgent
                <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </span>
            </div>
            <div className="mt-4">
              <span
                className="text-2xl font-bold text-on-surface"
                style={{ fontFamily: "var(--font-headline-md)" }}
              >
                {stats.critical}
              </span>
              <p className="text-xs text-on-surface-variant mt-0.5">Critical</p>
            </div>
          </Link>

          <Link
            href="/mastery"
            className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">
                  verified
                </span>
              </div>
              <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                Locked
                <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </span>
            </div>
            <div className="mt-4">
              <span
                className="text-2xl font-bold text-on-surface"
                style={{ fontFamily: "var(--font-headline-md)" }}
              >
                {stats.mastered}
              </span>
              <p className="text-xs text-on-surface-variant mt-0.5">Mastered</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Middle Section: Today's Priority Hero Card */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-lg font-bold text-on-surface"
            style={{ fontFamily: "var(--font-headline-sm)" }}
          >
            Immediate Focus
          </h3>
          <span className="text-xs text-on-surface-variant">
            AI-Optimized Schedule
          </span>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(124,58,237,0.08)] border border-primary-container/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>

          {immediateFocus ? (
            <>
              <div className="flex flex-col gap-2 max-w-2xl relative z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>{" "}
                    Critical risk badge
                  </span>
                </div>
                <h4
                  className="text-3xl font-bold text-on-surface mt-1"
                  style={{ fontFamily: "var(--font-headline-lg)" }}
                >
                  {immediateFocus.concept?.name}
                </h4>
                <p className="text-base text-on-surface-variant">
                  Memory trace decay is accelerating rapidly for this concept.
                  Immediate active recall recommended to prevent complete loss.
                </p>
              </div>
              <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/retention-check/${immediateFocus.concept?._id}`}
                  className="px-6 py-3.5 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Start Revision</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 max-w-2xl relative z-10">
              <h4 className="text-xl font-bold text-on-surface mt-1">
                You're all caught up!
              </h4>
              <p className="text-base text-on-surface-variant">
                Add more concepts to track to continue your learning journey.
              </p>
              <Link
                href="/subjects"
                className="mt-2 inline-flex w-fit px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium"
              >
                Add Concepts
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Section: Today's Revision Plan List */}
      <section className="flex flex-col gap-4 pb-16">
        <div className="flex items-center justify-between">
          <h3
            className="text-lg font-bold text-on-surface"
            style={{ fontFamily: "var(--font-headline-sm)" }}
          >
            Today's Revision Plan
          </h3>
          <span className="text-xs text-on-surface-variant">
            {revisionPlan.length} concepts queued
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {revisionPlan.length > 0 ? (
            revisionPlan.map((item, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest p-4 md:p-5 rounded-xl border border-outline-variant/40 hover:border-primary/40 transition-all flex items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-on-surface">
                      {item.concept?.name}
                    </h5>
                    <p className="text-xs text-on-surface-variant">
                      {Math.round(item.estimatedRetention)}% retention
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/retention-check/${item.concept?._id}`}
                    className="px-4 py-2 bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface rounded-lg text-sm transition-all"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 text-center text-on-surface-variant">
              No concepts in queue for today.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
