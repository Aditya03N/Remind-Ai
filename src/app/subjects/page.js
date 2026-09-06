"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Subjects() {
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadSubjects = async () => {
    try {
      const res = await fetchWithAuth("/learning/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Failed to load subjects", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadSubjects();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    try {
      const res = await fetchWithAuth("/learning/subjects", {
        method: "POST",
        body: JSON.stringify({ name: newTitle, description: newDesc }),
      });
      
      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        loadSubjects();
        toast.success("Subject created successfully!");
      } else {
        toast.error("Failed to create subject");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error creating subject");
    }
  };

  if (authLoading || loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 bg-surface-container-low rounded-lg w-1/3"></div>
      <div className="h-24 bg-surface-container-low rounded-xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-40 bg-surface-container-low rounded-xl w-full"></div>
        <div className="h-40 bg-surface-container-low rounded-xl w-full"></div>
        <div className="h-40 bg-surface-container-low rounded-xl w-full"></div>
      </div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>Your Subjects</h2>
          <p className="text-sm text-on-surface-variant">Manage the topics you are learning</p>
        </div>
      </div>

      <form onSubmit={handleCreateSubject} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-on-surface mb-1">Subject Name</label>
          <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g. Computer Science"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-on-surface mb-1">Description (Optional)</label>
          <input 
            type="text" 
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Data structures and algorithms"
          />
        </div>
        <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-xl shadow-md transition-all whitespace-nowrap h-[38px]">
          Add Subject
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((sub) => (
          <Link key={sub._id} href={`/subjects/${sub._id}`} className="block group">
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 hover:border-primary/50 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{sub.name}</h3>
                {sub.description && <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{sub.description}</p>}
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">View concepts</span>
                <span className="material-symbols-outlined text-sm text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
          </Link>
        ))}
        
        {subjects.length === 0 && (
          <div className="col-span-full py-12 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">library_books</span>
            <p className="text-on-surface font-medium">No subjects yet</p>
            <p className="text-sm text-on-surface-variant">Create your first subject above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
