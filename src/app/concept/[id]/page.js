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
  const [showSummary, setShowSummary] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

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
          if (data.aiSummary) {
            setShowSummary(true);
          }
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

  const handleGenerateFreshQuiz = async () => {
    setGeneratingQuiz(true);
    toast.loading("Generating 10 fresh AI active-recall questions...", { id: "fresh-quiz" });
    try {
      const materialText = (typeof concept?.studyMaterial === "string" && concept.studyMaterial.trim().length > 0)
        ? concept.studyMaterial.trim()
        : undefined;

      const res = await fetchWithAuth("/learning/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          conceptId,
          count: 10,
          studyMaterial: materialText
        })
      });
      if (res.ok) {
        toast.success("Fresh 10-Question Quiz ready! Starting now...", { id: "fresh-quiz" });
        router.push(`/retention-check/${conceptId}`);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to generate fresh quiz", { id: "fresh-quiz" });
      }
    } catch (err) {
      toast.error("Error generating fresh quiz", { id: "fresh-quiz" });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleToggleSummary = async () => {
    if (concept?.aiSummary) {
      setShowSummary(prev => !prev);
      return;
    }

    setGeneratingSummary(true);
    toast.loading("Synthesizing 2-minute AI cognitive summary...", { id: "concept-sum" });
    try {
      const materialText = (typeof concept?.studyMaterial === "string" && concept.studyMaterial.trim().length > 0)
        ? concept.studyMaterial.trim()
        : undefined;

      const res = await fetchWithAuth("/learning/ai/summary", {
        method: "POST",
        body: JSON.stringify({
          conceptId,
          studyMaterial: materialText
        })
      });
      if (res.ok) {
        const data = await res.json();
        setConcept(prev => ({ ...prev, aiSummary: data.summary }));
        setShowSummary(true);
        toast.success("AI Summary ready!", { id: "concept-sum" });
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to generate summary", { id: "concept-sum" });
      }
    } catch (err) {
      toast.error("Error generating summary", { id: "concept-sum" });
    } finally {
      setGeneratingSummary(false);
    }
  };

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
      {/* Active Process Loading Banner */}
      {generatingQuiz && (
        <div className="mb-4 p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3 shadow-xs animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-primary text-2xl animate-spin">
            progress_activity
          </span>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-on-surface">Generating 10 AI Active-Recall Questions...</h4>
            <p className="text-xs text-on-surface-variant">Reviewing concept material to generate questions. You will be redirected to the quiz shortly.</p>
          </div>
        </div>
      )}

      {generatingSummary && (
        <div className="mb-4 p-4 rounded-xl bg-primary-fixed/25 border border-primary/30 flex items-center gap-3 shadow-xs animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-primary text-2xl animate-spin">
            progress_activity
          </span>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-on-surface">Synthesizing 2-Minute Summary...</h4>
            <p className="text-xs text-on-surface-variant">Extracting key cognitive triggers and high-yield concepts.</p>
          </div>
        </div>
      )}

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

        {/* AI Synaptic Summary Section */}
        {concept.aiSummary && showSummary ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3 relative z-10 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-primary/15 pb-2.5">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">psychology</span>
                <span>2-Minute Synaptic Quick Summary</span>
              </div>
              <button
                onClick={handleToggleSummary}
                className="text-[11px] font-semibold text-on-surface-variant hover:text-primary flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-variant transition-colors"
                title="Hide summary from view"
              >
                <span className="material-symbols-outlined text-xs">visibility_off</span>
                <span>Hide Summary</span>
              </button>
            </div>
            <p className="text-xs md:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
              {concept.aiSummary}
            </p>
          </div>
        ) : concept.aiSummary && !showSummary ? (
          <div className="p-3 bg-surface-container-low/60 rounded-xl border border-dashed border-outline-variant/60 flex items-center justify-between gap-3 text-xs text-on-surface-variant relative z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">summarize</span>
              <span>AI Quick Revision Summary is currently hidden.</span>
            </div>
            <button
              onClick={handleToggleSummary}
              className="px-3 py-1 bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface rounded-lg font-semibold transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">visibility</span>
              <span>Show Summary</span>
            </button>
          </div>
        ) : null}

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

        {/* Action Controls */}
        <div className="pt-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border-t border-outline-variant/30 relative z-10">
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">lightbulb</span>
            <span>Active recall testing primes neural pathways and reinforces long-term memory.</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* AI Summary / Hide Summary Button */}
            <button
              onClick={handleToggleSummary}
              disabled={generatingSummary || generatingQuiz}
              className="px-4 py-2.5 bg-surface-container-low hover:bg-surface-variant text-on-surface text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-outline-variant/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-sm text-primary ${generatingSummary ? "animate-spin" : ""}`}>
                {generatingSummary ? "progress_activity" : concept.aiSummary ? (showSummary ? "visibility_off" : "visibility") : "summarize"}
              </span>
              <span>
                {generatingSummary
                  ? "Synthesizing Summary..."
                  : concept.aiSummary
                  ? (showSummary ? "Hide Summary" : "Show Summary")
                  : "Generate AI Summary"}
              </span>
            </button>

            {/* Generate Fresh Quiz Button */}
            <button
              onClick={handleGenerateFreshQuiz}
              disabled={generatingQuiz || generatingSummary}
              className="px-4 py-2.5 bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-sm ${generatingQuiz ? "animate-spin" : ""}`}>
                {generatingQuiz ? "progress_activity" : "auto_awesome"}
              </span>
              <span>{generatingQuiz ? "Generating Fresh Quiz..." : "Generate Fresh Quiz"}</span>
            </button>

            {/* Start 10-Question Quiz Button */}
            <Link 
              href={`/retention-check/${concept._id}`} 
              className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              <span>Start 10-Question Quiz</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
