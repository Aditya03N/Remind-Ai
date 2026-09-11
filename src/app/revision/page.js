"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function RevisionPlan() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState(null);
  const [allProgress, setAllProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [savingReminder, setSavingReminder] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [dashRes, allRes] = await Promise.all([
        fetchWithAuth("/progress/dashboard"),
        fetchWithAuth("/progress/all")
      ]);

      if (dashRes.ok) {
        const dJson = await dashRes.json();
        setDashboardData(dJson);
      }

      if (allRes.ok) {
        const aJson = await allRes.json();
        setAllProgress(aJson);
      }
    } catch (err) {
      console.error("Failed to load revision data:", err);
      toast.error("Failed to load revision topics.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleSetReminder = async (progressId, dateValue) => {
    setSavingReminder(progressId);
    try {
      const isoDate = dateValue ? new Date(dateValue).toISOString() : null;
      const res = await fetchWithAuth(`/progress/${progressId}/reminder`, {
        method: "PUT",
        body: JSON.stringify({ manualReminderDate: isoDate })
      });

      if (res.ok) {
        toast.success(dateValue ? "Revision date scheduled!" : "Revision schedule removed!");
        setAllProgress(prev => prev.map(p => p._id === progressId ? { ...p, manualReminderDate: isoDate } : p));
        setSelectedDates(prev => {
          const next = { ...prev };
          delete next[progressId];
          return next;
        });
        await loadData(true);
      } else {
        toast.error("Failed to update revision schedule.");
      }
    } catch (error) {
      toast.error("Network error while setting reminder.");
    } finally {
      setSavingReminder(null);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-container-low rounded-lg w-1/4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-surface-container-low rounded-xl"></div>
          <div className="h-28 bg-surface-container-low rounded-xl"></div>
          <div className="h-28 bg-surface-container-low rounded-xl"></div>
          <div className="h-28 bg-surface-container-low rounded-xl"></div>
        </div>
        <div className="h-96 bg-surface-container-low rounded-xl w-full"></div>
      </div>
    );
  }

  if (!user) return null;

  const overview = dashboardData?.knowledgeOverview || { STRONG: 0, MODERATE_RISK: 0, HIGH_RISK: 0, CRITICAL: 0, MASTERED: 0 };
  const urgentCount = (overview.CRITICAL || 0) + (overview.HIGH_RISK || 0);
  const scheduledCount = allProgress.filter(p => !!p.manualReminderDate).length;

  const filteredProgress = allProgress.filter((prog) => {
    if (activeCategory === "ALL") return true;
    if (activeCategory === "URGENT") return prog.knowledgeStatus === "CRITICAL" || prog.knowledgeStatus === "HIGH_RISK";
    if (activeCategory === "MODERATE_RISK") return prog.knowledgeStatus === "MODERATE_RISK";
    if (activeCategory === "STRONG") return prog.knowledgeStatus === "STRONG";
    if (activeCategory === "MASTERED") return prog.knowledgeStatus === "MASTERED";
    if (activeCategory === "SCHEDULED") return !!prog.manualReminderDate;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>
            Revision Planner
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Track learned topics categorized by memory retention and set custom revision dates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/subjects"
            className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Learn New Concept</span>
          </Link>
        </div>
      </div>

      {/* Top Categorized Section Tiles (Interactive) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* 1. Urgent / Critical */}
        <button
          onClick={() => setActiveCategory(activeCategory === "URGENT" ? "ALL" : "URGENT")}
          className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
            activeCategory === "URGENT"
              ? "border-error ring-2 ring-error/20 bg-error-container/15"
              : "bg-surface-container-lowest border-outline-variant/40 hover:border-error/50"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">warning</span>
            </div>
            <span className="text-xs text-error font-bold">Urgent</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
              {urgentCount}
            </span>
            <p className="text-xs text-on-surface-variant mt-0.5">High Risk Topics</p>
          </div>
        </button>

        {/* 2. Fading / Moderate Risk */}
        <button
          onClick={() => setActiveCategory(activeCategory === "MODERATE_RISK" ? "ALL" : "MODERATE_RISK")}
          className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
            activeCategory === "MODERATE_RISK"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/10"
              : "bg-surface-container-lowest border-outline-variant/40 hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">schedule</span>
            </div>
            <span className="text-xs text-amber-700 font-bold">Fading</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
              {overview.MODERATE_RISK || 0}
            </span>
            <p className="text-xs text-on-surface-variant mt-0.5">Moderate Risk</p>
          </div>
        </button>

        {/* 3. Stable / Strong */}
        <button
          onClick={() => setActiveCategory(activeCategory === "STRONG" ? "ALL" : "STRONG")}
          className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
            activeCategory === "STRONG"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10"
              : "bg-surface-container-lowest border-outline-variant/40 hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">check_circle</span>
            </div>
            <span className="text-xs text-emerald-700 font-bold">Stable</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
              {overview.STRONG || 0}
            </span>
            <p className="text-xs text-on-surface-variant mt-0.5">Strong Topics</p>
          </div>
        </button>

        {/* 4. Mastered */}
        <button
          onClick={() => setActiveCategory(activeCategory === "MASTERED" ? "ALL" : "MASTERED")}
          className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
            activeCategory === "MASTERED"
              ? "border-primary ring-2 ring-primary/20 bg-primary-container/15"
              : "bg-surface-container-lowest border-outline-variant/40 hover:border-primary/50"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
            </div>
            <span className="text-xs text-primary font-bold">Mastered</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
              {overview.MASTERED || 0}
            </span>
            <p className="text-xs text-on-surface-variant mt-0.5">Permanent Nodes</p>
          </div>
        </button>

        {/* 5. Custom Scheduled Reminders */}
        <button
          onClick={() => setActiveCategory(activeCategory === "SCHEDULED" ? "ALL" : "SCHEDULED")}
          className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
            activeCategory === "SCHEDULED"
              ? "border-secondary ring-2 ring-secondary/20 bg-secondary-fixed/30"
              : "bg-surface-container-lowest border-outline-variant/40 hover:border-secondary/50"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">edit_calendar</span>
            </div>
            <span className="text-xs text-on-secondary-fixed font-bold">Planned</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
              {scheduledCount}
            </span>
            <p className="text-xs text-on-surface-variant mt-0.5">Custom Reminders</p>
          </div>
        </button>
      </div>

      {/* Filter Tabs & Section Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="text-xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>
            {activeCategory === "ALL" && "All Learned Topics"}
            {activeCategory === "URGENT" && "🚨 Urgent & Critical Retention Topics"}
            {activeCategory === "MODERATE_RISK" && "⏳ Moderately Fading Topics"}
            {activeCategory === "STRONG" && "✅ Stable Knowledge Nodes"}
            {activeCategory === "MASTERED" && "🏆 Mastered Concepts"}
            {activeCategory === "SCHEDULED" && "📅 Manually Scheduled Revisions"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Showing {filteredProgress.length} topic{filteredProgress.length === 1 ? "" : "s"} • Set custom revision dates or start an active recall quiz.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `All (${allProgress.length})` },
            { id: "URGENT", label: `Urgent (${urgentCount})` },
            { id: "MODERATE_RISK", label: `Fading (${overview.MODERATE_RISK || 0})` },
            { id: "STRONG", label: `Strong (${overview.STRONG || 0})` },
            { id: "MASTERED", label: `Mastered (${overview.MASTERED || 0})` },
            { id: "SCHEDULED", label: `Scheduled (${scheduledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === tab.id
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Table & Manual Planner */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 overflow-hidden">
        {filteredProgress.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">
              {activeCategory === "SCHEDULED" ? "event_busy" : "school"}
            </span>
            <h3 className="text-lg font-bold text-on-surface">
              {activeCategory === "SCHEDULED" ? "No Custom Reminders Set" : "No Topics in this Category"}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm">
              {activeCategory === "SCHEDULED"
                ? "Select any topic from the list to set a custom date and time for revision."
                : "Add concepts or take active-recall quizzes to populate your spaced repetition planner."}
            </p>
            {activeCategory !== "ALL" && (
              <button
                onClick={() => setActiveCategory("ALL")}
                className="mt-2 px-4 py-2 bg-surface-container text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-variant transition-all"
              >
                View All Topics
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Concept &amp; Subject</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Memory Retention</th>
                  <th className="px-6 py-4 font-semibold">Manual Revision Schedule</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredProgress.map((prog) => {
                  const conceptId = prog.conceptId?._id || prog.conceptId;
                  const conceptName = prog.conceptId?.name || "Concept";
                  const subjectName = prog.conceptId?.subjectId?.name || "General";
                  const retention = Math.round(prog.estimatedRetention || 0);

                  const isCrit = prog.knowledgeStatus === "CRITICAL";
                  const isHigh = prog.knowledgeStatus === "HIGH_RISK";
                  const isMod = prog.knowledgeStatus === "MODERATE_RISK";
                  const isMastered = prog.knowledgeStatus === "MASTERED";

                  return (
                    <tr key={prog._id} className="hover:bg-surface-container/40 transition-colors">
                      {/* Concept & Subject */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-on-surface text-sm">{conceptName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-on-surface-variant px-2 py-0.5 bg-surface-container rounded-md">
                              {subjectName}
                            </span>
                            {prog.difficulty && (
                              <span className="text-[11px] text-on-surface-variant">
                                • {prog.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Knowledge Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          isMastered ? "bg-primary-container/20 text-primary border-primary/30" :
                          isCrit ? "bg-error-container text-error border-error/30" :
                          isHigh ? "bg-amber-500/10 text-amber-700 border-amber-500/30" :
                          isMod ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" :
                          "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                        }`}>
                          <span className="material-symbols-outlined text-xs">
                            {isMastered ? "verified" : isCrit || isHigh ? "warning" : "check"}
                          </span>
                          <span>{prog.knowledgeStatus?.replace("_", " ")}</span>
                        </span>
                      </td>

                      {/* Retention Rate & Progress Bar */}
                      <td className="px-6 py-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-on-surface">{retention}%</span>
                            <span className="text-on-surface-variant font-normal">{prog.revisionCount || 0} revs</span>
                          </div>
                          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                retention >= 80 ? "bg-emerald-500" :
                                retention >= 60 ? "bg-amber-500" :
                                "bg-error"
                              }`}
                              style={{ width: `${Math.min(100, retention)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Manual Revision Date Picker */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="datetime-local"
                            value={selectedDates[prog._id] !== undefined ? selectedDates[prog._id] : formatDateForInput(prog.manualReminderDate)}
                            onChange={(e) => setSelectedDates(prev => ({ ...prev, [prog._id]: e.target.value }))}
                            disabled={savingReminder === prog._id}
                            className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          {selectedDates[prog._id] !== undefined && selectedDates[prog._id] !== formatDateForInput(prog.manualReminderDate) && selectedDates[prog._id] !== "" && (
                            <button
                              onClick={() => handleSetReminder(prog._id, selectedDates[prog._id])}
                              disabled={savingReminder === prog._id}
                              className="px-2.5 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary-container transition-all flex items-center gap-1 shadow-xs shrink-0 disabled:opacity-50"
                              title="Confirm and set revision date/time"
                            >
                              <span className="material-symbols-outlined text-xs">check</span>
                              <span>{savingReminder === prog._id ? "Saving..." : "Set"}</span>
                            </button>
                          )}
                          {prog.manualReminderDate && (
                            <button
                              onClick={() => {
                                setSelectedDates(prev => ({ ...prev, [prog._id]: "" }));
                                handleSetReminder(prog._id, null);
                              }}
                              disabled={savingReminder === prog._id}
                              className="p-1 rounded-md text-error hover:bg-error-container/20 transition-colors"
                              title="Clear manual schedule"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Action Links */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {conceptId && (
                            <>
                              <Link
                                href={`/retention-check/${conceptId}`}
                                className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary-container transition-all flex items-center gap-1 shadow-xs"
                              >
                                <span className="material-symbols-outlined text-xs">play_arrow</span>
                                <span>Give Quiz</span>
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
