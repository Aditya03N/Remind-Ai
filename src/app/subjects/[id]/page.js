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

  // AI & Material States
  const [activeMaterialConcept, setActiveMaterialConcept] = useState(null);
  const [materialText, setMaterialText] = useState("");
  const [generatingAI, setGeneratingAI] = useState(null); // stores conceptId currently generating

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const subRes = await fetchWithAuth("/learning/subjects");
      if (subRes.ok) {
        const subs = await subRes.json();
        const found = subs.find(s => s._id === subjectId);
        setSubject(found || { name: "Unknown Subject" });
      }

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
    }
  };

  const handleSaveMaterial = async (conceptId) => {
    try {
      const res = await fetchWithAuth(`/learning/concepts/${conceptId}/material`, {
        method: "PUT",
        body: JSON.stringify({ studyMaterial: materialText })
      });
      if (res.ok) {
        toast.success("Study material saved!");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to save material");
    }
  };

  const handleGenerateAI = async (conceptId) => {
    setGeneratingAI(conceptId);
    toast.loading("Analyzing material and generating questions...", { id: "ai-gen" });
    try {
      const res = await fetchWithAuth("/learning/ai/generate", {
        method: "POST",
        body: JSON.stringify({ conceptId, count: 5 })
      });
      if (res.ok) {
        toast.success("AI generated questions successfully!", { id: "ai-gen" });
        // Hide panel after generation
        setActiveMaterialConcept(null);
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.message || "AI Generation failed", { id: "ai-gen" });
      }
    } catch (error) {
      toast.error("AI Generation failed", { id: "ai-gen" });
    }
    setGeneratingAI(null);
  };

  if (authLoading || loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 bg-surface-container-low rounded-lg w-1/3"></div>
      <div className="h-24 bg-surface-container-low rounded-xl w-full"></div>
      <div className="grid grid-cols-1 gap-4">
        <div className="h-48 bg-surface-container-low rounded-xl w-full"></div>
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

      <div className="grid grid-cols-1 gap-6">
        {concepts.map((con) => (
          <div key={con._id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4">
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-sm">memory</span>
                  </div>
                  <h4 className="text-md font-bold text-on-surface">{con.name}</h4>
                </div>
                {con.description && <p className="text-sm text-on-surface-variant line-clamp-3 pl-10">{con.description}</p>}
              </div>

              <div className="flex items-center gap-2 md:pl-0 pl-10 flex-wrap">
                {!con.baselineTaken ? (
                  <button onClick={() => router.push(`/retention-check/${con._id}?mode=baseline`)} className="px-4 py-1.5 text-xs bg-error text-on-error font-medium rounded-lg hover:bg-error/90 flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-sm">play_circle</span> Take Baseline Assessment
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs rounded-full flex items-center gap-1 border border-outline-variant">
                    <span className="material-symbols-outlined text-xs text-primary">check_circle</span> Baseline Complete
                  </span>
                )}
                
                <button 
                  onClick={() => {
                    setActiveMaterialConcept(activeMaterialConcept === con._id ? null : con._id);
                    setMaterialText(con.studyMaterial || "");
                  }}
                  className="px-4 py-1.5 text-xs bg-primary-container text-on-primary-container font-medium rounded-lg hover:brightness-95 flex items-center gap-1 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">smart_toy</span> AI Options
                </button>
              </div>
            </div>
            
            {/* AI & Material Panel */}
            {activeMaterialConcept === con._id && (
              <div className="mt-2 pl-10 border-l-2 border-primary/20 ml-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/50 space-y-4">
                  <div>
                    <h5 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">description</span> Study Material
                    </h5>
                    <p className="text-xs text-on-surface-variant mb-3">Paste your notes here. AI will use this material to generate relevant questions.</p>
                    <textarea 
                      value={materialText}
                      onChange={(e) => setMaterialText(e.target.value)}
                      placeholder="Paste your study notes, textbook excerpts, or topics here..."
                      className="w-full h-32 bg-surface-container border border-outline-variant rounded-lg p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    ></textarea>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleSaveMaterial(con._id)} className="px-4 py-1.5 text-xs bg-surface-container-highest hover:bg-surface-variant text-on-surface rounded-md font-medium border border-outline-variant transition-colors">
                        Save Notes
                      </button>
                      <button 
                        onClick={() => handleGenerateAI(con._id)} 
                        disabled={generatingAI === con._id}
                        className="px-4 py-1.5 text-xs bg-primary text-on-primary rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {generatingAI === con._id ? (
                          <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Generating...</>
                        ) : (
                          <><span className="material-symbols-outlined text-sm">auto_awesome</span> Generate Questions</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Quiz Creation (kept for backward compatibility) */}
            <div className="pl-10">
              {activeQuizConcept === con._id ? (
                <div className="mt-2 space-y-3 bg-surface-container-low p-4 rounded-lg border border-outline-variant/50">
                  <h5 className="text-sm font-bold text-on-surface">Manual Question</h5>
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
                    <button onClick={() => handleCreateQuiz(con._id)} className="px-3 py-1.5 text-xs bg-surface-container-highest border border-outline-variant text-on-surface font-medium rounded-md hover:bg-surface-variant">Add Manual Question</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setActiveQuizConcept(con._id)}
                  className="mt-2 text-xs font-medium text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">add</span> Add manual question
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
