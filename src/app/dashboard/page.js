"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "../../utils/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [allProgress, setAllProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [dismissedReminders, setDismissedReminders] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, allRes] = await Promise.all([
        fetchWithAuth("/progress/dashboard"),
        fetchWithAuth("/progress/all")
      ]);

      if (dashRes.ok) {
        const json = await dashRes.json();
        setData(json);
      } else {
        setError("Failed to load dashboard metrics.");
      }

      if (allRes.ok) {
        const allJson = await allRes.json();
        setAllProgress(allJson);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Network error while connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismissReminder = async (progressId) => {
    try {
      setDismissedReminders(prev => [...prev, progressId]);
      await fetchWithAuth(`/progress/${progressId}/reminder`, {
        method: "PUT",
        body: JSON.stringify({ manualReminderDate: null })
      });
      toast.success("Reminder dismissed");
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-44 bg-surface-container-low rounded-xl"></div>
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-44 bg-surface-container-low rounded-xl"></div>
            <div className="h-44 bg-surface-container-low rounded-xl"></div>
            <div className="h-44 bg-surface-container-low rounded-xl"></div>
            <div className="h-44 bg-surface-container-low rounded-xl"></div>
          </div>
        </div>
        <div className="h-48 bg-surface-container-low rounded-2xl"></div>
        <div className="h-64 bg-surface-container-low rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-error-container/20 border border-error/30 rounded-2xl text-center flex flex-col items-center gap-4 my-8">
        <span className="material-symbols-outlined text-4xl text-error">cloud_off</span>
        <div>
          <h3 className="text-lg font-bold text-on-surface">Unable to load dashboard</h3>
          <p className="text-sm text-on-surface-variant mt-1">{error}</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary-container transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const overview = data?.knowledgeOverview || { STRONG: 0, MODERATE_RISK: 0, HIGH_RISK: 0, CRITICAL: 0, MASTERED: 0 };
  const categorized = data?.categorizedTopics || { STRONG: [], MODERATE_RISK: [], HIGH_RISK: [], CRITICAL: [], MASTERED: [] };
  const urgentCount = (overview.CRITICAL || 0) + (overview.HIGH_RISK || 0);
  const urgentTopics = [...(categorized.CRITICAL || []), ...(categorized.HIGH_RISK || [])];
  
  const allTopics = [
    ...(categorized.MASTERED || []),
    ...(categorized.CRITICAL || []),
    ...(categorized.HIGH_RISK || []),
    ...(categorized.MODERATE_RISK || []),
    ...(categorized.STRONG || [])
  ];

  const getFilteredTopics = () => {
    switch (activeCategory) {
      case "MASTERED":
        return categorized.MASTERED || [];
      case "URGENT":
        return urgentTopics;
      case "MODERATE_RISK":
        return categorized.MODERATE_RISK || [];
      case "STRONG":
        return categorized.STRONG || [];
      case "ALL":
      default:
        return allTopics;
    }
  };

  const currentFilteredTopics = getFilteredTopics();
  const overallHealth = data?.overallHealth || 0;
  const totalConcepts = data?.totalConcepts || allTopics.length;
  const todayPriority = data?.todayPriority;
  const nextQueuedTopics = data?.revisionPlan?.slice(1, 4) || [];

  // Check for due manual reminders (scheduled date reached)
  const now = new Date();
  const dueReminders = allProgress.filter(p => {
    if (!p.manualReminderDate) return false;
    if (dismissedReminders.includes(p._id)) return false;
    return new Date(p.manualReminderDate) <= now;
  });

  return (
    <div className="flex flex-col gap-10">
      {/* Due Manual Reminders Banner */}
      {dueReminders.length > 0 && (
        <div className="space-y-3">
          {dueReminders.map((rem) => {
            const conceptId = rem.conceptId?._id || rem.conceptId;
            const conceptName = rem.conceptId?.name || "Topic";
            const subjectName = rem.conceptId?.subjectId?.name || "Subject";

            return (
              <div 
                key={rem._id}
                className="p-4 md:p-5 bg-secondary-fixed/40 border-2 border-secondary rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0 shadow-xs animate-bounce">
                    <span className="material-symbols-outlined text-xl">alarm</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-secondary text-on-secondary rounded-full uppercase tracking-wide">
                        Scheduled Reminder
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">{subjectName}</span>
                    </div>
                    <h4 className="text-base font-bold text-on-surface mt-0.5">
                      Revision Due: {conceptName}
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      Your scheduled revision time for this topic has arrived. Complete a quick active recall check now!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleDismissReminder(rem._id)}
                    className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                  <Link
                    href={`/retention-check/${conceptId}`}
                    className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    <span>Revise Now</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top Section: Overall Knowledge Health & Quick Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Knowledge Health Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-container/5 rounded-full pointer-events-none"></div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-on-surface-variant font-medium">Overall Knowledge Health</span>
              <span className="px-2.5 py-0.5 bg-tertiary-fixed/30 text-on-tertiary-fixed-variant text-xs font-semibold rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">analytics</span>
                {overallHealth >= 80 ? "Optimal" : overallHealth >= 60 ? "Moderate" : "Needs Review"}
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="text-4xl font-bold text-primary" style={{fontFamily: "var(--font-headline-xl)"}}>
                {overallHealth}%
              </span>
              <span className="text-xs text-on-surface-variant">Avg retention rate</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden flex">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-700" 
                style={{ width: `${Math.min(100, Math.max(overallHealth, 5))}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-on-surface-variant">
              <span>Decay rate: {overallHealth > 75 ? "Low" : overallHealth > 50 ? "Moderate" : "High"}</span>
              <span>{totalConcepts} active concepts</span>
            </div>
          </div>
        </div>

        {/* Knowledge Overview: 4 Interactive Summary Tiles */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Stable / Strong */}
          <button 
            onClick={() => setActiveCategory(activeCategory === "STRONG" ? "ALL" : "STRONG")}
            className={`bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border text-left flex flex-col justify-between transition-all cursor-pointer ${
              activeCategory === "STRONG" ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5" : "border-outline-variant/40 hover:border-emerald-500/50"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">check_circle</span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold">Stable</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
                {overview.STRONG || 0}
              </span>
              <p className="text-xs text-on-surface-variant mt-0.5">Strong Topics</p>
            </div>
          </button>

          {/* Fading / Moderate Risk */}
          <button 
            onClick={() => setActiveCategory(activeCategory === "MODERATE_RISK" ? "ALL" : "MODERATE_RISK")}
            className={`bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border text-left flex flex-col justify-between transition-all cursor-pointer ${
              activeCategory === "MODERATE_RISK" ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5" : "border-outline-variant/40 hover:border-amber-500/50"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">schedule</span>
              </div>
              <span className="text-xs text-amber-700 font-semibold">Fading</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
                {overview.MODERATE_RISK || 0}
              </span>
              <p className="text-xs text-on-surface-variant mt-0.5">At Risk</p>
            </div>
          </button>

          {/* Urgent / Critical + High Risk */}
          <button 
            onClick={() => setActiveCategory(activeCategory === "URGENT" ? "ALL" : "URGENT")}
            className={`bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border text-left flex flex-col justify-between transition-all cursor-pointer ${
              activeCategory === "URGENT" ? "border-error ring-2 ring-error/20 bg-error-container/10" : "border-outline-variant/40 hover:border-error/50"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">warning</span>
              </div>
              <span className="text-xs text-error font-semibold">Urgent</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
                {urgentCount}
              </span>
              <p className="text-xs text-on-surface-variant mt-0.5">High Risk Topics</p>
            </div>
          </button>

          {/* Mastered / Locked */}
          <button 
            onClick={() => setActiveCategory(activeCategory === "MASTERED" ? "ALL" : "MASTERED")}
            className={`bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border text-left flex flex-col justify-between transition-all cursor-pointer ${
              activeCategory === "MASTERED" ? "border-primary ring-2 ring-primary/20 bg-primary-container/10" : "border-outline-variant/40 hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              </div>
              <span className="text-xs text-primary font-semibold">Locked</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
                {overview.MASTERED || 0}
              </span>
              <p className="text-xs text-on-surface-variant mt-0.5">Mastered Topics</p>
            </div>
          </button>
        </div>
      </section>

      {/* Middle Section: Interactive Categorized Topics Explorer */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>
              {activeCategory === "ALL" && "All Concepts Overview"}
              {activeCategory === "MASTERED" && "🏆 Mastered Concepts"}
              {activeCategory === "URGENT" && "🚨 High Risk & Critical Topics"}
              {activeCategory === "MODERATE_RISK" && "⏳ Moderately Fading Topics"}
              {activeCategory === "STRONG" && "✅ Strong & Stable Topics"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {currentFilteredTopics.length} topic{currentFilteredTopics.length === 1 ? "" : "s"} in this category
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "All" },
              { id: "MASTERED", label: `Mastered (${overview.MASTERED || 0})` },
              { id: "URGENT", label: `High Risk (${urgentCount})` },
              { id: "MODERATE_RISK", label: `Fading (${overview.MODERATE_RISK || 0})` },
              { id: "STRONG", label: `Strong (${overview.STRONG || 0})` },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Cards Grid */}
        {currentFilteredTopics.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-dashed border-outline-variant/60 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">
              {activeCategory === "MASTERED" ? "workspace_premium" : "school"}
            </span>
            <div className="max-w-md">
              <h4 className="text-base font-semibold text-on-surface">
                {activeCategory === "MASTERED" && "No Mastered Topics Yet"}
                {activeCategory === "URGENT" && "No High Risk Topics 🎉"}
                {activeCategory === "MODERATE_RISK" && "No Fading Topics"}
                {activeCategory === "STRONG" && "No Strong Topics Yet"}
                {activeCategory === "ALL" && "No Concepts Added Yet"}
              </h4>
              <p className="text-xs text-on-surface-variant mt-1">
                {activeCategory === "MASTERED" && "Complete retention checks with score ≥80% twice to cement concepts into permanent mastery."}
                {activeCategory === "URGENT" && "Awesome job! None of your active concepts are currently facing severe retention decay."}
                {activeCategory === "ALL" && "Start by creating a subject and adding your first concepts to begin AI retention tracking."}
                {(activeCategory === "STRONG" || activeCategory === "MODERATE_RISK") && "Practice active recall quizzes to update memory decay metrics."}
              </p>
            </div>
            {activeCategory === "ALL" && (
              <Link 
                href="/subjects"
                className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-container transition-all"
              >
                + Add Subject &amp; Concepts
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFilteredTopics.map((topic) => {
              const statusColor = 
                topic.knowledgeStatus === "MASTERED" ? "bg-primary-container/20 text-primary border-primary/30" :
                topic.knowledgeStatus === "CRITICAL" ? "bg-error-container text-error border-error/30" :
                topic.knowledgeStatus === "HIGH_RISK" ? "bg-amber-500/10 text-amber-700 border-amber-500/30" :
                topic.knowledgeStatus === "MODERATE_RISK" ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" :
                "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";

              return (
                <div 
                  key={topic.progressId || topic.conceptId}
                  className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 hover:border-primary/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusColor}`}>
                        {topic.knowledgeStatus === "MASTERED" && <span className="material-symbols-outlined text-xs">verified</span>}
                        {topic.knowledgeStatus === "CRITICAL" && <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>}
                        {topic.knowledgeStatus?.replace("_", " ")}
                      </span>
                      <span className="text-xs text-on-surface-variant px-2 py-0.5 bg-surface-container rounded-md">
                        {topic.subjectName || "Subject"}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-on-surface mt-1 line-clamp-1">
                      {topic.name}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant mt-2">
                      <span>Retention Score:</span>
                      <span className="font-bold text-on-surface">{topic.estimatedRetention}%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          topic.estimatedRetention >= 80 ? "bg-emerald-500" :
                          topic.estimatedRetention >= 60 ? "bg-amber-500" :
                          "bg-error"
                        }`}
                        style={{ width: `${Math.min(100, topic.estimatedRetention)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">repeat</span>
                      {topic.revisionCount || 0} revisions
                    </span>
                    <Link 
                      href={`/concept/${topic.conceptId}`}
                      className="px-3.5 py-1.5 bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                    >
                      <span>Start Revision / Quiz</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Immediate Focus & Up Next Hero Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>Immediate Focus &amp; Up Next</h3>
          <span className="text-xs text-on-surface-variant">AI Spaced Repetition Engine</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Immediate Focus Card */}
          <div className="lg:col-span-2">
            {todayPriority ? (
              <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(124,58,237,0.08)] border border-primary-container/20 relative overflow-hidden flex flex-col justify-between gap-6 h-full">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col gap-2 relative z-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span> 
                      #1 Priority: {todayPriority.status?.replace("_", " ") || "Critical Attention"}
                    </span>
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span> 
                      Est. time: {todayPriority.recommendedDuration?.minMinutes || 10}-{todayPriority.recommendedDuration?.maxMinutes || 15} mins
                    </span>
                    <span className="text-xs text-on-surface-variant px-2 py-0.5 bg-surface-container rounded-md">
                      {todayPriority.concept?.subjectId?.name || "Topic"}
                    </span>
                  </div>
                  <h4 className="text-2xl md:text-3xl font-bold text-on-surface mt-2" style={{fontFamily: "var(--font-headline-lg)"}}>
                    {todayPriority.concept?.name || "Priority Concept"}
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Memory retention is at <span className="font-bold text-error">{todayPriority.estimatedRetention}%</span>. Performing active recall now prevents retrieval failure.
                  </p>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link 
                    href={`/retention-check/${todayPriority.concept?._id || ""}`}
                    className="px-6 py-3 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    <span>Start Active Recall Quiz</span>
                  </Link>
                  <Link
                    href={`/concept/${todayPriority.concept?._id || ""}`}
                    className="px-4 py-3 bg-surface-container-low hover:bg-surface-variant text-on-surface text-xs font-semibold rounded-xl text-center transition-colors"
                  >
                    View Decay Analysis
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/40 flex items-center justify-between gap-4 h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-on-surface">Knowledge Shield Active</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">No immediate decay alerts! All concepts are in safe retention zones.</p>
                  </div>
                </div>
                <Link 
                  href="/subjects"
                  className="px-4 py-2 bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                >
                  Explore Concepts
                </Link>
              </div>
            )}
          </div>

          {/* Up Next in Queue Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/40 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-outline-variant/30 pb-2">
                <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">queue</span>
                  <span>Up Next to Revise</span>
                </h4>
                <Link href="/revision" className="text-xs text-primary font-semibold hover:underline">
                  View All ({data?.revisionPlan?.length || 0})
                </Link>
              </div>

              {nextQueuedTopics.length > 0 ? (
                <div className="space-y-3">
                  {nextQueuedTopics.map((item, idx) => {
                    const conceptId = item.concept?._id || "";
                    const isCrit = item.status === "CRITICAL" || item.status === "HIGH_RISK";

                    return (
                      <div 
                        key={item.progressId || idx}
                        className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-on-surface truncate">{item.concept?.name || "Concept"}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-0.5">
                            <span className={isCrit ? "text-error font-semibold" : "text-amber-700"}>
                              {item.estimatedRetention}% ret
                            </span>
                            <span>•</span>
                            <span>{item.concept?.subjectId?.name || "Subject"}</span>
                          </div>
                        </div>

                        <Link
                          href={`/retention-check/${conceptId}`}
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">play_arrow</span>
                          <span>Quiz</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-on-surface-variant space-y-1">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">done_all</span>
                  <p className="font-semibold">Queue is clear!</p>
                  <p className="text-[11px]">No other urgent concepts scheduled.</p>
                </div>
              )}
            </div>

            <Link
              href="/revision"
              className="w-full py-2 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-xs font-semibold text-center transition-colors block"
            >
              Open Revision Planner
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Section: Revision Plan Overview */}
      <section className="flex flex-col gap-4 pb-16">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>Today's Revision Plan</h3>
          <span className="text-xs text-on-surface-variant">{data?.revisionPlan?.length || 0} concepts queued</span>
        </div>

        {(!data?.revisionPlan || data.revisionPlan.length === 0) ? (
          <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-center text-xs text-on-surface-variant">
            No scheduled revisions due today. Add more concepts or trigger manual retention checks!
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {data.revisionPlan.map((item, idx) => (
              <div 
                key={item.progressId || idx}
                className="bg-surface-container-lowest p-4 md:p-5 rounded-xl border border-outline-variant/40 hover:border-primary/40 transition-all flex items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-on-surface">{item.concept?.name || "Concept"}</h5>
                    <p className="text-xs text-on-surface-variant">
                      Est. time: {item.recommendedDuration?.minMinutes || 10}-{item.recommendedDuration?.maxMinutes || 15} mins • {item.estimatedRetention}% retention
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full hidden sm:inline-flex items-center gap-1 ${
                    item.status === "CRITICAL" ? "bg-error-container text-error" :
                    item.status === "HIGH_RISK" ? "bg-amber-500/10 text-amber-700" :
                    "bg-yellow-500/10 text-yellow-700"
                  }`}>
                    {item.status === "CRITICAL" ? "🔴 Critical" : item.status === "HIGH_RISK" ? "⚠️ High Risk" : "⏳ Moderate"}
                  </span>
                  <Link 
                    href={`/retention-check/${item.concept?._id || ""}`}
                    className="px-4 py-2 bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface rounded-lg text-xs font-semibold transition-all"
                  >
                    Revise
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
