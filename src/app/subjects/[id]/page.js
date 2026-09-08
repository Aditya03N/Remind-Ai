"use client";

import { useEffect, useState, useRef } from "react";
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

  // AI, Material & Upload States
  const [activeMaterialConcept, setActiveMaterialConcept] = useState(null);
  const [materialText, setMaterialText] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [deletingConceptId, setDeletingConceptId] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(null);
  const [summaries, setSummaries] = useState({});

  // Summary Modal State
  const [modalConcept, setModalConcept] = useState(null);

  // Hidden file input refs mapping
  const fileInputRefs = useRef({});

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
        
        // Cache pre-existing summaries
        const initialSummaries = {};
        data.forEach(c => {
          if (c.aiSummary) initialSummaries[c._id] = c.aiSummary;
        });
        setSummaries(initialSummaries);
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

  const handleDeleteConcept = async (e, conceptId, conceptName) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete the concept "${conceptName}"?`)) {
      return;
    }

    setDeletingConceptId(conceptId);
    try {
      const res = await fetchWithAuth(`/learning/concepts/${conceptId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success(`Deleted concept "${conceptName}"`);
        await loadData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to delete concept");
      }
    } catch (error) {
      toast.error("Error deleting concept");
    } finally {
      setDeletingConceptId(null);
    }
  };

  const handleFileUpload = async (conceptId, file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Document size exceeds 5MB limit. Please upload a smaller file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingDoc(conceptId);
    toast.loading(`Extracting & analyzing ${file.name}...`, { id: "upload-doc" });

    try {
      const res = await fetchWithAuth(`/learning/concepts/${conceptId}/upload-material`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Parsed "${data.fileName}" (${Math.round(data.characterCount)} chars)! AI will use this material.`, { id: "upload-doc" });
        await loadData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to upload document", { id: "upload-doc" });
      }
    } catch (error) {
      toast.error("Network error during document upload", { id: "upload-doc" });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSaveMaterial = async (conceptId) => {
    try {
      const res = await fetchWithAuth(`/learning/concepts/${conceptId}/material`, {
        method: "PUT",
        body: JSON.stringify({ studyMaterial: materialText })
      });
      if (res.ok) {
        toast.success("Notes saved successfully!");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to save material");
    }
  };

  const handleGenerateAI = async (conceptId) => {
    setGeneratingAI(conceptId);
    const conceptObj = concepts.find(c => c._id === conceptId);
    const hasDoc = !!conceptObj?.notesFileName;
    
    toast.loading(hasDoc ? `Generating 10 questions from "${conceptObj.notesFileName}"...` : "Generating 10 AI active-recall questions...", { id: "ai-gen" });
    try {
      const res = await fetchWithAuth("/learning/ai/generate", {
        method: "POST",
        body: JSON.stringify({ conceptId, count: 10, studyMaterial: materialText || undefined })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Generated ${data.questionsCount || 10} questions! Ready to quiz.`, { id: "ai-gen" });
        await loadData();
        router.push(`/retention-check/${conceptId}`);
      } else {
        const err = await res.json();
        toast.error(err.message || "AI Generation failed", { id: "ai-gen" });
      }
    } catch (error) {
      toast.error("AI Generation failed", { id: "ai-gen" });
    }
    setGeneratingAI(null);
  };

  const handleGenerateSummary = async (conceptId) => {
    setGeneratingSummary(conceptId);
    const conceptObj = concepts.find(c => c._id === conceptId);
    const hasDoc = !!conceptObj?.notesFileName;

    toast.loading(hasDoc ? `Summarizing "${conceptObj.notesFileName}"...` : "Creating high-yield pre-quiz summary...", { id: "ai-sum" });
    try {
      const res = await fetchWithAuth("/learning/ai/summary", {
        method: "POST",
        body: JSON.stringify({ conceptId, studyMaterial: materialText || undefined })
      });
      if (res.ok) {
        const data = await res.json();
        setSummaries(prev => ({ ...prev, [conceptId]: data.summary }));
        setModalConcept(data.concept || concepts.find(c => c._id === conceptId));
        toast.success("Topic summary ready!", { id: "ai-sum" });
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to generate summary", { id: "ai-sum" });
      }
    } catch (error) {
      toast.error("Failed to generate summary", { id: "ai-sum" });
    }
    setGeneratingSummary(null);
  };

  const openSummaryModal = (con) => {
    setModalConcept(con);
    if (!summaries[con._id] && !con.aiSummary) {
      handleGenerateSummary(con._id);
    }
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
          <h2 className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
            {subject?.name} - Concepts
          </h2>
          <p className="text-sm text-on-surface-variant">Upload notes/PDFs, generate tailored active-recall quizzes, and test your memory</p>
        </div>
      </div>

      {/* Add Concept Form */}
      <form onSubmit={handleCreateConcept} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-on-surface mb-1">Concept Title</label>
          <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g. Dynamic Programming"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-on-surface mb-1">Key Details / Topic Scope (Optional)</label>
          <input 
            type="text" 
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g. Memoization, Tabulation, Knapsack variations"
          />
        </div>
        <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-xl shadow-md transition-all whitespace-nowrap h-[38px]">
          + Add Concept
        </button>
      </form>

      {/* Concepts List */}
      <div className="grid grid-cols-1 gap-6">
        {concepts.map((con) => (
          <div key={con._id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4 transition-all relative">
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-sm">memory</span>
                  </div>
                  <h4 className="text-base font-bold text-on-surface">{con.name}</h4>
                </div>
                {con.description && <p className="text-sm text-on-surface-variant pl-10">{con.description}</p>}
                
                {/* Status Badges & Uploaded Doc Indicator */}
                <div className="flex items-center gap-2 pl-10 mt-2 flex-wrap">
                  {con.notesFileName ? (
                    <span className="text-xs px-2.5 py-0.5 bg-secondary-fixed/50 text-on-secondary-fixed font-semibold rounded-full flex items-center gap-1 border border-secondary/30">
                      <span className="material-symbols-outlined text-xs">attach_file</span>
                      <span>Notes: {con.notesFileName}</span>
                    </span>
                  ) : null}

                  {con.quizCount > 0 ? (
                    <span className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 font-semibold rounded-full flex items-center gap-1 border border-emerald-500/20">
                      <span className="material-symbols-outlined text-xs">quiz</span> {con.quizCount} Questions Available
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 bg-amber-500/10 text-amber-700 font-medium rounded-full flex items-center gap-1 border border-amber-500/20">
                      <span className="material-symbols-outlined text-xs">auto_awesome</span> Ready for AI Generation
                    </span>
                  )}

                  {summaries[con._id] || con.aiSummary ? (
                    <span className="text-xs px-2.5 py-0.5 bg-primary/10 text-primary font-medium rounded-full flex items-center gap-1 border border-primary/20">
                      <span className="material-symbols-outlined text-xs">lightbulb</span> Summary Ready
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 md:pl-0 pl-10 flex-wrap">
                {/* Hidden File Input for PDF/TXT/MD Upload */}
                <input 
                  type="file"
                  ref={el => fileInputRefs.current[con._id] = el}
                  accept=".pdf,.txt,.md,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(con._id, e.target.files[0]);
                    }
                  }}
                />

                {/* 1. Upload Notes Button */}
                <button
                  onClick={() => fileInputRefs.current[con._id]?.click()}
                  disabled={uploadingDoc === con._id}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-xs ${
                    con.notesFileName
                      ? "bg-secondary-fixed/30 border-secondary/40 text-on-secondary-fixed hover:bg-secondary-fixed/50"
                      : "bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-variant hover:border-primary"
                  }`}
                  title="Upload PDF, TXT, or MD notes under 5MB to customize questions"
                >
                  <span className="material-symbols-outlined text-sm">
                    {uploadingDoc === con._id ? "progress_activity" : con.notesFileName ? "file_present" : "upload_file"}
                  </span>
                  <span>
                    {uploadingDoc === con._id 
                      ? "Uploading..." 
                      : con.notesFileName 
                      ? "Replace Notes" 
                      : "Upload Notes"}
                  </span>
                </button>

                {/* 2. View / Generate Summary Button */}
                <button
                  onClick={() => openSummaryModal(con)}
                  className="px-3.5 py-1.5 text-xs bg-secondary-fixed text-on-secondary-fixed font-semibold rounded-lg hover:brightness-95 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">summarize</span>
                  <span>{summaries[con._id] || con.aiSummary ? "View Summary" : "Generate Summary"}</span>
                </button>

                {/* 3. Give Quiz / Generate & Start Quiz Button */}
                <Link 
                  href={`/retention-check/${con._id}`}
                  className="px-4 py-1.5 text-xs bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>play_arrow</span>
                  <span>{con.quizCount > 0 ? `Give Quiz (${con.quizCount} Qs)` : "Generate & Start Quiz"}</span>
                </Link>

                {/* 4. Manual Notes Editor Toggle */}
                <button 
                  onClick={() => {
                    setActiveMaterialConcept(activeMaterialConcept === con._id ? null : con._id);
                    setMaterialText(con.studyMaterial || "");
                  }}
                  className={`p-1.5 text-xs rounded-lg transition-all border ${
                    activeMaterialConcept === con._id 
                      ? "bg-surface-container-high border-primary text-primary"
                      : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface"
                  }`}
                  title="View/Edit study notes"
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                </button>

                {/* 5. Delete Concept Button */}
                <button
                  onClick={(e) => handleDeleteConcept(e, con._id, con.name)}
                  disabled={deletingConceptId === con._id}
                  className="p-1.5 text-xs rounded-lg text-on-surface-variant/60 hover:text-error hover:bg-error-container/30 transition-all"
                  title="Delete Concept"
                >
                  <span className="material-symbols-outlined text-sm">
                    {deletingConceptId === con._id ? "progress_activity" : "delete"}
                  </span>
                </button>
              </div>
            </div>
            
            {/* AI Notes Drawer & Document Preview */}
            {activeMaterialConcept === con._id && (
              <div className="mt-2 pl-4 md:pl-8 border-l-2 border-primary/30 ml-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">description</span> 
                      Study Material &amp; Document Text ({con.notesFileName || "Custom Notes"})
                    </h5>
                    {con.studyMaterial && (
                      <span className="text-xs text-on-surface-variant">
                        {con.studyMaterial.length} characters loaded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {con.notesFileName 
                      ? `Extracted text from "${con.notesFileName}". You can edit or append text before generating AI questions.`
                      : "Type, paste notes, or use the 'Upload Notes' button to attach PDFs/docs for AI analysis."}
                  </p>
                  <textarea 
                    value={materialText}
                    onChange={(e) => setMaterialText(e.target.value)}
                    placeholder="Paste notes, definitions, formulas, or syllabus content here..."
                    className="w-full h-28 bg-surface-container border border-outline-variant rounded-lg p-3 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-mono"
                  ></textarea>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => handleSaveMaterial(con._id)} 
                      className="px-3.5 py-1.5 text-xs bg-surface-container-highest hover:bg-surface-variant text-on-surface rounded-md font-medium border border-outline-variant transition-colors"
                    >
                      Save Notes
                    </button>

                    <button 
                      onClick={() => handleGenerateSummary(con._id)} 
                      disabled={generatingSummary === con._id}
                      className="px-3.5 py-1.5 text-xs bg-secondary-fixed text-on-secondary-fixed rounded-md font-semibold hover:brightness-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {generatingSummary === con._id ? (
                        <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Generating Summary...</>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">summarize</span> Summarize Notes</>
                      )}
                    </button>

                    <button 
                      onClick={() => handleGenerateAI(con._id)} 
                      disabled={generatingAI === con._id}
                      className="px-4 py-1.5 text-xs bg-primary text-on-primary rounded-md font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {generatingAI === con._id ? (
                        <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Generating 10 Questions...</>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">auto_awesome</span> Generate 10 Questions From Notes</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        ))}

        {concepts.length === 0 && (
          <div className="col-span-full py-12 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">psychology</span>
            <p className="text-on-surface font-medium">No concepts yet</p>
            <p className="text-sm text-on-surface-variant">Add your first concept above to start uploading notes and generating AI quizzes.</p>
          </div>
        )}
      </div>

      {/* Instant Summary Modal */}
      {modalConcept && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest max-w-2xl w-full rounded-2xl border border-primary/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-surface-container-low border-b border-outline-variant/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">{modalConcept.name}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {modalConcept.notesFileName ? `Summary synthesized from "${modalConcept.notesFileName}"` : "High-Yield AI Topic Summary"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalConcept(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {generatingSummary === modalConcept._id ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-semibold text-on-surface">Analyzing notes with Google Gemini...</p>
                  <p className="text-xs text-on-surface-variant">Extracting core principles, definitions, and active recall cues.</p>
                </div>
              ) : summaries[modalConcept._id] || modalConcept.aiSummary ? (
                <div className="text-xs md:text-sm text-on-surface leading-relaxed whitespace-pre-wrap bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 font-sans">
                  {summaries[modalConcept._id] || modalConcept.aiSummary}
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-on-surface-variant">No summary generated yet for this concept.</p>
                  <button
                    onClick={() => handleGenerateSummary(modalConcept._id)}
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold shadow-sm"
                  >
                    Generate AI Summary Now
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant/40 flex items-center justify-between gap-3">
              <button
                onClick={() => handleGenerateSummary(modalConcept._id)}
                disabled={generatingSummary === modalConcept._id}
                className="px-3.5 py-2 text-xs bg-surface-container-highest hover:bg-surface-variant text-on-surface rounded-lg font-medium border border-outline-variant transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Regenerate Summary</span>
              </button>

              <Link
                href={`/retention-check/${modalConcept._id}`}
                onClick={() => setModalConcept(null)}
                className="px-5 py-2 text-xs bg-primary hover:bg-primary-container text-on-primary font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                <span>Start Quiz ({modalConcept.quizCount || 10} Qs)</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
