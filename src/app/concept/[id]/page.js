"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { fetchWithAuth } from "../../../utils/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ConceptDetails({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const conceptId = params.id;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [concept, setConcept] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadConceptData = async () => {
      if (!conceptId || conceptId === "1") {
        setLoading(false);
        return;
      }

      try {
        const res = await fetchWithAuth(`/learning/concepts/${conceptId}`);
        if (res.ok) {
          const data = await res.json();
          setConcept(data);
        }

        const progRes = await fetchWithAuth("/progress/all");
        if (progRes.ok) {
          const allProg = await progRes.json();
          const currentProg = allProg.find(p => p.conceptId?._id === conceptId || p.conceptId === conceptId);
          if (currentProg) setProgress(currentProg);
        }
      } catch (err) {
        console.error("Failed to load concept details", err);
      }
      setLoading(false);
    };

    if (user) {
      loadConceptData();
    }
  }, [user, conceptId]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-container-low rounded-lg w-1/4"></div>
        <div className="h-64 bg-surface-container-low rounded-xl w-full"></div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
        <h2 className="text-xl font-bold text-on-surface">Concept Not Found</h2>
        <p className="text-sm text-on-surface-variant">Please choose a valid concept from your subjects or dashboard.</p>
        <Link href="/dashboard" className="inline-block px-5 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const retentionVal = progress ? Math.round(progress.estimatedRetention || progress.currentScore || 50) : 60;
  const status = progress ? progress.knowledgeStatus : "MODERATE_RISK";

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
        <Link href="/revision" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Revision Plan</span>
        </Link>
        <span>/</span>
        <span className="text-on-surface font-medium">Concept Decay Analysis</span>
      </div>

      <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(124,58,237,0.06)] border border-outline-variant/30 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="text-xs text-primary font-medium tracking-wide uppercase">
              {concept.subjectId?.name || "Subject Topic"} • Difficulty: {concept.difficulty || "Medium"}
            </span>
            <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>
              {concept.name}
            </h1>
          </div>
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border self-start sm:self-auto ${
            status === "STRONG" || status === "MASTERED"
              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
              : status === "HIGH_RISK" || status === "CRITICAL"
              ? "bg-error-container text-on-error-container border-error/25"
              : "bg-amber-500/10 text-amber-700 border-amber-500/30"
          }`}>
            <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>
              {status === "STRONG" || status === "MASTERED" ? "verified" : "warning"}
            </span>
            <span className="text-xs font-semibold uppercase">{status.replace("_", " ")}</span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-lg p-5 border border-outline-variant/40 space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <span className="material-symbols-outlined text-base">psychology</span>
            <span>Why revision is recommended now</span>
          </div>
          <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
            Our predictive memory model indicates that your retention of <strong className="text-on-surface">{concept.name}</strong> is currently at <strong className="text-primary">{retentionVal}%</strong>. Regular reinforcement before it decays below the threshold secures this knowledge permanently.
          </p>
        </div>

        {concept.aiSummary && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
              <span className="material-symbols-outlined text-base">summarize</span>
              <span>AI Quick Revision Summary</span>
            </div>
            <p className="text-xs md:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
              {concept.aiSummary}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 relative z-10">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Suggested Duration</p>
              <p className="text-sm font-bold text-on-surface">5 - 10 minutes (10 Qs)</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Estimated Retention</p>
              <p className="text-sm font-bold text-on-surface">{retentionVal}% Current</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined">neurology</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Knowledge Status</p>
              <p className="text-sm font-bold text-on-surface">{status}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-outline-variant/30 relative z-10">
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">lightbulb</span>
            <span>Taking this quiz refreshes your memory trace and prevents forgetting.</span>
          </div>
          <Link href={`/retention-check/${concept._id}`} className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary-container text-on-primary text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">play_arrow</span>
            <span>Start 10-Question Quiz</span>
          </Link>
        </div>
      </section>
    </>
  );
}
