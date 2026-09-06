"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Mastery() {
  const { user, loading: authLoading } = useAuth();
  const [mastered, setMastered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMastered = async () => {
      try {
        const res = await fetchWithAuth("/progress/mastered");
        if (res.ok) {
          const data = await res.json();
          setMastered(data);
        } else {
          toast.error("Failed to fetch mastered concepts");
        }
      } catch (error) {
        console.error(error);
        toast.error("Network error");
      }
      setLoading(false);
    };

    if (user) loadMastered();
    else setLoading(false);
  }, [user]);

  if (authLoading || loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-surface-container-low rounded-lg w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-32 bg-surface-container-low rounded-xl"></div>
        <div className="h-32 bg-surface-container-low rounded-xl"></div>
      </div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>Mastery</h1>
        <p className="text-sm text-on-surface-variant mt-1">Your Trophy Room. Concepts you have committed to long-term memory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mastered.length > 0 ? mastered.map((prog) => (
          <div key={prog._id} className="bg-primary-container/20 p-6 rounded-xl border border-primary/30 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-lg">workspace_premium</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">{prog.conceptId?.name || "Unknown"}</h3>
              </div>
              <p className="text-sm text-on-surface-variant">Mastered after {prog.revisionCount} revisions.</p>
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant/30 text-xs font-medium text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span> Long-Term Memory
            </div>
          </div>
        )) : (
          <div className="col-span-full py-16 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">emoji_events</span>
            <h3 className="text-xl font-bold text-on-surface mb-2">No mastered concepts yet</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">Keep taking retention checks and revising concepts. Once a concept hits 90%+ retention consistently, it will appear here!</p>
            <Link href="/revision" className="inline-block mt-6 px-6 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-container transition-all">
              Go to Revision Plan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
