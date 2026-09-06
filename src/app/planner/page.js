"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Planner() {
  const { user, loading: authLoading } = useAuth();
  const [progresses, setProgresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadProgress = async () => {
    try {
      const res = await fetchWithAuth("/progress/all");
      if (res.ok) {
        const data = await res.json();
        setProgresses(data);
      }
    } catch (error) {
      console.error("Failed to load planner data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadProgress();
    else setLoading(false);
  }, [user]);

  const handleSetReminder = async (progressId, dateValue) => {
    try {
      const res = await fetchWithAuth(`/progress/${progressId}/reminder`, {
        method: "PUT",
        body: JSON.stringify({ manualReminderDate: dateValue }),
      });
      if (res.ok) {
        toast.success(dateValue ? "Reminder set successfully!" : "Reminder cleared!");
        loadProgress();
      } else {
        toast.error("Failed to set reminder");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    }
  };

  if (authLoading || loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-surface-container-low rounded-lg w-1/3"></div>
      <div className="h-96 bg-surface-container-low rounded-xl w-full"></div>
    </div>
  );
  if (!user) return null;

  // Format date for datetime-local input (YYYY-MM-DDThh:mm)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Adjust for timezone offset
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>Manual Planner</h1>
          <p className="text-sm text-on-surface-variant mt-1">Set explicit dates and times to revise specific concepts.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant">
            <tr>
              <th className="px-6 py-4 font-medium">Concept</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Retention</th>
              <th className="px-6 py-4 font-medium">Manual Reminder</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {progresses.length > 0 ? progresses.map((prog) => (
              <tr key={prog._id} className="hover:bg-surface-container transition-colors">
                <td className="px-6 py-4 font-medium text-on-surface">{prog.conceptId?.name || 'Unknown'}</td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2 py-1 bg-surface-container-high rounded-lg text-on-surface-variant">
                    {prog.knowledgeStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{Math.round(prog.estimatedRetention)}%</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="datetime-local" 
                      value={formatDateForInput(prog.manualReminderDate)}
                      onChange={(e) => handleSetReminder(prog._id, e.target.value)}
                      className="bg-surface-container border border-outline-variant rounded px-2 py-1 text-sm focus:outline-none focus:border-primary text-on-surface"
                    />
                    {prog.manualReminderDate && (
                      <button 
                        onClick={() => handleSetReminder(prog._id, null)}
                        className="text-error hover:text-error-container material-symbols-outlined text-sm"
                        title="Clear Reminder"
                      >
                        close
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/retention-check/${prog.conceptId?._id}`} className="text-primary hover:text-primary-container font-medium">Revise Now</Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant">
                  No concepts studied yet. Start learning!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
