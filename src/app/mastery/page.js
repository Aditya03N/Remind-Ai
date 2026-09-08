"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Mastery() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadMasteryData = async () => {
      try {
        const res = await fetchWithAuth("/progress/dashboard");
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Failed to load mastery data", err);
      }
      setLoading(false);
    };

    if (user) {
      loadMasteryData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-container-low rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-28 bg-surface-container-low rounded-xl"></div>
          <div className="h-28 bg-surface-container-low rounded-xl"></div>
        </div>
      </div>
    );
  }

  const masteredList = dashboardData?.categorizedTopics?.MASTERED || [];
  const strongList = dashboardData?.categorizedTopics?.STRONG || [];
  const avgHealth = dashboardData?.systemHealthScore || 0;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>Mastery &amp; Progress History</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track long-term knowledge retention and consolidated concepts.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-xl shadow-sm transition-all flex items-center space-x-2">
            <span className="material-symbols-outlined text-sm">dashboard</span>
            <span>View Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Overall System Health</span>
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>trending_up</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>{avgHealth}%</div>
            <p className="text-xs text-on-surface-variant mt-1">Average retention across topics</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Mastered Concepts</span>
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>{masteredList.length}</div>
            <p className="text-xs text-on-surface-variant mt-1">{strongList.length} near mastery (Strong)</p>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary-container text-on-primary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>Mastered Concepts ({masteredList.length})</h2>
              <p className="text-xs text-on-surface-variant">Permanently consolidated knowledge nodes secured against decay.</p>
            </div>
          </div>
        </div>

        {masteredList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {masteredList.map((item) => (
              <div key={item._id} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                <div className="absolute top-4 right-4 text-primary bg-primary-fixed/50 p-2 rounded-full">
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
                <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-medium">
                  {item.conceptId?.subjectId?.name || "Subject"}
                </span>
                <h3 className="text-lg font-bold text-on-surface mt-4" style={{fontFamily: "var(--font-headline-sm)"}}>
                  {item.conceptId?.name || "Topic"}
                </h3>
                <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Retention: {Math.round(item.estimatedRetention)}%</span>
                  <Link href={`/retention-check/${item.conceptId?._id}`} className="text-primary font-bold hover:underline">
                    Take Quiz
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant space-y-2">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">workspace_premium</span>
            <p className="text-on-surface font-semibold">No Mastered Concepts Yet</p>
            <p className="text-xs text-on-surface-variant">Topics graduate to Mastered once you consistently score 90%+ on periodic retention checks.</p>
          </div>
        )}
      </section>
    </>
  );
}
