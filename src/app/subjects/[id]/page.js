"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { fetchWithAuth } from "../../../utils/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SubjectDetail() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id;
  const { user, loading: authLoading } = useAuth();
  
  const [subject, setSubject] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [activeQuizConcept, setActiveQuizConcept] = useState(null);
  const [quizForm, setQuizForm] = useState({ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      // Find subject name (inefficient but works for now as there's no single subject endpoint usually)
      const subRes = await fetchWithAuth("/learning/subjects");
      if (subRes.ok) {
        const subs = await subRes.json();
        const found = subs.find(s => s._id === subjectId);
        setSubject(found || { name: "Unknown Subject" });
      }

      // Fetch concepts for subject
      const conRes = await fetchWithAuth(`/learning/concepts/subject/${subjectId}`);
      if (conRes.ok) {
        const data = await conRes.json();
        setConcepts(data);
      }
    } catch (error) {
      console.error("Failed to load subject data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && subjectId) {
      loadData();
    } else if (!user) {
      setLoading(false);
    }
  }, [user, subjectId]);

  const handleCreateConcept = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    try {
      const res = await fetchWithAuth("/learning/concepts", {
        method: "POST",
        body: JSON.stringify({ 
          name: newTitle, 
          description: newDesc,
          subjectId: subjectId,
          difficulty: "Medium"
        }),
      });
      
      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        loadData();
        toast.success("Concept added successfully!");
      }
    } catch (error) {
      toast.error("Failed to create concept");
      console.error("Failed to create concept", error);
    }
  };

  const handleCreateQuiz = async (conceptId) => {
    if (!quizForm.questionText || quizForm.options.some(o => !o.trim())) {
      toast.error("Please fill all question text and 4 options.");
      return;
    }
    
    try {
      const res = await fetchWithAuth("/learning/quizzes", {
        method: "POST",
        body: JSON.stringify({
          conceptId,
          title: "Flashcard Quiz",
          questions: [
            {
              questionText: quizForm.questionText,
              options: quizForm.options,
              correctOptionIndex: parseInt(quizForm.correctOptionIndex)
            }
          ]
        })
      });
      
      if (res.ok) {
        setActiveQuizConcept(null);
        setQuizForm({ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 });
        toast.success("Quiz created successfully!");
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("Failed to create quiz");
      console.error("Failed to create quiz", error);
    }
  };

  if (authLoading || loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 bg-surface-container-low rounded-lg w-1/3"></div>
      <div className="h-24 bg-surface-container-low rounded-xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-32 bg-surface-container-low rounded-xl w-full"></div>
        <div className="h-32 bg-surface-container-low rounded-xl w-full"></div>
      </div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/subjects" className="p-2 bg-surface-container-low hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>{subject?.name} - Concepts</h2>
          <p className="text-sm text-on-surface-variant">Add specific concepts you want to memorize</p>
        </div>
      </div>

      <form onSubmit={handleCreateConcept} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-on-surface mb-1">Concept Title</label>
          <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g. Merge Sort"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-on-surface mb-1">Content / Description</label>
          <input 
            type="text" 
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="How does it work?"
          />
        </div>
        <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-xl shadow-md transition-all whitespace-nowrap h-[38px]">
          Add Concept
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {concepts.map((con) => (
          <div key={con._id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm">memory</span>
                </div>
                <h4 className="text-md font-bold text-on-surface">{con.name}</h4>
              </div>
              {con.description && <p className="text-sm text-on-surface-variant line-clamp-3 pl-10">{con.description}</p>}
            </div>
            
            <div className="pl-10">
              {activeQuizConcept === con._id ? (
                <div className="mt-4 space-y-3 bg-surface-container-low p-4 rounded-lg border border-outline-variant/50">
                  <h5 className="text-sm font-bold text-on-surface">Create Quiz</h5>
                  <input 
                    type="text" placeholder="Question Text" 
                    value={quizForm.questionText} onChange={e => setQuizForm({...quizForm, questionText: e.target.value})}
                    className="w-full bg-surface-container border border-outline-variant rounded-md px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                  {quizForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${con._id}`} checked={quizForm.correctOptionIndex === i} onChange={() => setQuizForm({...quizForm, correctOptionIndex: i})} />
                      <input 
                        type="text" placeholder={`Option ${i+1}`}
                        value={opt} onChange={e => {
                          const newOpts = [...quizForm.options];
                          newOpts[i] = e.target.value;
                          setQuizForm({...quizForm, options: newOpts});
                        }}
                        className="w-full bg-surface-container border border-outline-variant rounded-md px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setActiveQuizConcept(null)} className="px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-variant rounded-md">Cancel</button>
                    <button onClick={() => handleCreateQuiz(con._id)} className="px-3 py-1.5 text-xs bg-primary text-on-primary font-medium rounded-md hover:bg-primary-container">Save Quiz</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setActiveQuizConcept(con._id)}
                  className="mt-2 text-xs font-medium text-primary hover:text-primary-container flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">add_box</span> Add Flashcard Quiz
                </button>
              )}
            </div>
          </div>
        ))}

        {concepts.length === 0 && (
          <div className="col-span-full py-12 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">psychology</span>
            <p className="text-on-surface font-medium">No concepts yet</p>
            <p className="text-sm text-on-surface-variant">Add a concept above to start your spaced repetition journey.</p>
          </div>
        )}
      </div>
    </div>
  );
}
