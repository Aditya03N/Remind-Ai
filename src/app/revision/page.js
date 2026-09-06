"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import { useRouter } from "next/navigation";

export default function RevisionPlan() {
  const { user, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const res = await fetchWithAuth("/progress/recommendations");
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      }
      setLoading(false);
    };

    if (user) loadRecommendations();
    else setLoading(false);
  }, [user]);

  if (authLoading || loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-surface-container-low rounded-lg w-1/3"></div>
      <div className="h-96 bg-surface-container-low rounded-xl w-full"></div>
    </div>
  );
  if (!user) return null;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>Revision Plan</h1>
          <p className="text-sm text-on-surface-variant mt-1">Your personalized knowledge recovery queue.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant">
            <tr>
              <th className="px-6 py-4 font-medium">Concept</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Retention</th>
              <th className="px-6 py-4 font-medium">Suggested Time</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {recommendations.length > 0 ? recommendations.map((rec) => (
              <tr key={rec.progressId} className="hover:bg-surface-container transition-colors">
                <td className="px-6 py-4 font-medium text-on-surface">{rec.concept?.name || 'Unknown Concept'}</td>
                <td className="px-6 py-4">
                  {rec.status === "CRITICAL" && (
                    <span className="flex items-center gap-1.5 text-error">
                      <div className="w-2 h-2 rounded-full bg-error"></div> Critical
                    </span>
                  )}
                  {rec.status === "HIGH_RISK" && (
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div> High Risk
                    </span>
                  )}
                  {(rec.status === "MODERATE_RISK" || rec.status === "STRONG") && (
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div> {rec.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{Math.round(rec.estimatedRetention)}%</td>
                <td className="px-6 py-4 text-on-surface-variant">{rec.recommendedDuration} mins</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/retention-check/${rec.concept?._id}`} className="text-primary hover:text-primary-container font-medium">Revise →</Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant">
                  No concepts need revision right now. Great job!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
