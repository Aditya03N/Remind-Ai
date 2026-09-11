"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { fetchWithAuth } from "../../../utils/api";
import toast from "react-hot-toast";

export default function RetentionCheck({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();
  const conceptId = params.id;
  const isBaseline = searchParams.get("mode") === "baseline";
  const startWithSummary = searchParams.get("summary") === "true";

  const [concept, setConcept] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Summary display state
  const [showSummary, setShowSummary] = useState(startWithSummary);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionIndex]: selectedOptionIndex }
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    if (conceptId) {
      loadQuizData();
    }
  }, [conceptId]);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      const conRes = await fetchWithAuth(`/learning/concepts/${conceptId}`);
      if (conRes.ok) {
        const conData = await conRes.json();
        setConcept(conData);
        if (startWithSummary && conData.aiSummary) {
          setShowSummary(true);
        }
      }

      const quizRes = await fetchWithAuth(`/learning/quizzes/concept/${conceptId}`);
      if (quizRes.ok) {
        const quizData = await quizRes.json();
        setQuiz(quizData);
      }
    } catch (err) {
      console.error("Failed to load quiz data:", err);
      toast.error("Failed to load quiz.");
    } finally {
      setLoading(false);
      setStartTime(Date.now());
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Document size exceeds 5MB limit. Please choose a smaller file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingDoc(true);
    toast.loading(`Extracting & analyzing ${file.name}...`, { id: "upload-quiz-doc" });

    try {
      const res = await fetchWithAuth(`/learning/concepts/${conceptId}/upload-material`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Notes "${data.fileName}" loaded! Generating questions...`, { id: "upload-quiz-doc" });
        setConcept(prev => ({
          ...(prev || {}),
          studyMaterial: data.studyMaterial,
          notesFileName: data.fileName,
          aiSummary: data.concept?.aiSummary || prev?.aiSummary
        }));
        // Automatically generate 10 questions from the newly uploaded document directly
        await handleGenerateQuestions(data.studyMaterial, data.fileName);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to upload document", { id: "upload-quiz-doc" });
      }
    } catch (error) {
      toast.error("Error during document upload", { id: "upload-quiz-doc" });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleGenerateQuestions = async (overrideMaterial, overrideFileName) => {
    setGenerating(true);
    const materialText = typeof overrideMaterial === "string" ? overrideMaterial : (concept?.studyMaterial || "");
    const fileName = typeof overrideFileName === "string" ? overrideFileName : concept?.notesFileName;
    const hasDoc = !!fileName || (typeof materialText === "string" && materialText.trim().length > 0);
    toast.loading(hasDoc ? `Analyzing "${fileName || "Notes"}" & generating 10 questions...` : "Generating 10 AI active-recall questions...", { id: "gen-q" });
    try {
      const res = await fetchWithAuth("/learning/ai/generate", {
        method: "POST",
        body: JSON.stringify({ 
          conceptId, 
          count: 10, 
          studyMaterial: (typeof materialText === "string" && materialText.trim().length > 0) ? materialText.trim() : undefined 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQuiz(data.quiz);
        setAnswers({});
        setCurrentIndex(0);
        setSubmitted(false);
        setScoreResult(null);
        setStartTime(Date.now());
        toast.success("10 Questions ready from notes! Starting quiz...", { id: "gen-q" });
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to generate questions", { id: "gen-q" });
      }
    } catch (err) {
      console.error("Generate questions error:", err);
      toast.error("Error generating questions", { id: "gen-q" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSummary = async (overrideMaterial) => {
    setGeneratingSummary(true);
    const materialText = typeof overrideMaterial === "string" ? overrideMaterial : (concept?.studyMaterial || "");
    toast.loading("Synthesizing pre-quiz summary from notes...", { id: "gen-sum" });
    try {
      const res = await fetchWithAuth("/learning/ai/summary", {
        method: "POST",
        body: JSON.stringify({ 
          conceptId, 
          studyMaterial: (typeof materialText === "string" && materialText.trim().length > 0) ? materialText.trim() : undefined 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setConcept(prev => ({ ...prev, aiSummary: data.summary }));
        setShowSummary(true);
        toast.success("Summary generated! Review below.", { id: "gen-sum" });
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to generate summary", { id: "gen-sum" });
      }
    } catch (err) {
      console.error("Generate summary error:", err);
      toast.error("Error generating summary", { id: "gen-sum" });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const selectOption = (optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: optIdx
    }));
  };

  const handleSubmitQuiz = async () => {
    const questions = quiz?.questions || [];
    if (questions.length === 0 || submitting) return;

    setSubmitting(true);
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionIndex) {
        correctCount += 1;
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await fetchWithAuth("/learning/attempts", {
        method: "POST",
        body: JSON.stringify({
          quizId: quiz._id,
          conceptId,
          score: correctCount,
          totalQuestions: questions.length,
          assessmentType: isBaseline ? "INITIAL" : "RETENTION_CHECK",
          timeTaken
        })
      });

      if (res.ok) {
        setScoreResult({
          score: correctCount,
          total: questions.length,
          percentage,
          timeTaken
        });
        setSubmitted(true);
        toast.success(`Quiz Completed! Score: ${percentage}%`);
      } else {
        toast.error("Failed to save quiz attempt.");
      }
    } catch (err) {
      console.error("Save attempt error:", err);
      toast.error("Failed to record score.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8 animate-pulse">
        <div className="h-6 bg-surface-container-low rounded-md w-1/4"></div>
        <div className="h-64 bg-surface-container-low rounded-2xl w-full"></div>
      </div>
    );
  }

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === questions.length && questions.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Hidden File Input for all document types */}
      <input 
        type="file"
        ref={fileInputRef}
        accept=".docx,.doc,.pdf,.txt,.md,.rtf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf,text/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* Active Processing Indicator Banner */}
      {generating && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3 shadow-xs animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-primary text-2xl animate-spin">
            progress_activity
          </span>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-on-surface">Generating 10 Active-Recall Questions...</h4>
            <p className="text-xs text-on-surface-variant">AI is reviewing your syllabus & notes to create high-retention questions. This takes just a few seconds.</p>
          </div>
        </div>
      )}

      {uploadingDoc && (
        <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center gap-3 shadow-xs animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-secondary text-2xl animate-spin">
            progress_activity
          </span>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-on-surface">Processing & Parsing Document...</h4>
            <p className="text-xs text-on-surface-variant">Extracting text notes and preparing AI question generation.</p>
          </div>
        </div>
      )}

      {generatingSummary && (
        <div className="p-4 rounded-xl bg-primary-fixed/25 border border-primary/30 flex items-center gap-3 shadow-xs animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-primary text-2xl animate-spin">
            progress_activity
          </span>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-on-surface">Synthesizing High-Yield Summary...</h4>
            <p className="text-xs text-on-surface-variant">AI is summarizing core definitions and revision cues from your material.</p>
          </div>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Link 
            href={concept?.subjectId ? `/subjects/${concept.subjectId._id || concept.subjectId}` : "/dashboard"} 
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Subject</span>
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold truncate">{concept?.name || "Concept"}</span>
          {concept?.notesFileName && (
            <span className="ml-2 px-2 py-0.5 bg-secondary-fixed/50 text-on-secondary-fixed text-[11px] font-semibold rounded-full hidden sm:inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">attach_file</span>
              <span>{concept.notesFileName}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload Notes Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingDoc || generating}
            className="px-3 py-1.5 text-xs rounded-lg font-semibold bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-variant transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload Word (.docx / .doc), PDF, or text notes under 5MB for specific question generation"
          >
            <span className={`material-symbols-outlined text-sm ${uploadingDoc ? "animate-spin" : ""}`}>
              {uploadingDoc ? "progress_activity" : "upload_file"}
            </span>
            <span>{uploadingDoc ? "Uploading..." : concept?.notesFileName ? "Change Document" : "Upload Word / Notes"}</span>
          </button>

          {/* Generate Fresh Quiz Button */}
          <button
            onClick={() => handleGenerateQuestions()}
            disabled={generating || uploadingDoc}
            className="px-3 py-1.5 text-xs rounded-lg font-semibold bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate a brand new set of 10 questions with AI"
          >
            <span className={`material-symbols-outlined text-sm ${generating ? "animate-spin" : ""}`}>
              {generating ? "progress_activity" : "auto_awesome"}
            </span>
            <span>{generating ? "Generating Fresh Quiz..." : "Generate Fresh Quiz"}</span>
          </button>

          {/* Summary Toggle / Generate Button */}
          <button
            onClick={() => {
              if (!concept?.aiSummary) {
                handleGenerateSummary();
              } else {
                setShowSummary(!showSummary);
              }
            }}
            disabled={generatingSummary}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
              showSummary 
                ? "bg-primary text-on-primary" 
                : "bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-variant"
            }`}
          >
            <span className={`material-symbols-outlined text-sm ${generatingSummary ? "animate-spin" : ""}`}>
              {generatingSummary ? "progress_activity" : concept?.aiSummary && showSummary ? "visibility_off" : "summarize"}
            </span>
            <span>
              {generatingSummary 
                ? "Generating Summary..." 
                : showSummary 
                ? "Hide Summary" 
                : concept?.aiSummary 
                ? "View Summary" 
                : "Generate Summary"}
            </span>
          </button>
        </div>
      </div>

      {/* Pre-Quiz Summary Accordion Banner */}
      {showSummary && (
        <div className="p-6 bg-surface-container-lowest rounded-2xl border border-primary/30 shadow-md space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Quick Revision Summary: {concept?.name}</h4>
                <p className="text-xs text-on-surface-variant">
                  {concept?.notesFileName ? `Synthesized from "${concept.notesFileName}"` : "Review before testing your recall with the 10-question quiz"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleGenerateSummary()}
                disabled={generatingSummary}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 p-1 disabled:opacity-50"
                title="Regenerate Summary"
              >
                <span className={`material-symbols-outlined text-xs ${generatingSummary ? "animate-spin" : ""}`}>
                  {generatingSummary ? "progress_activity" : "refresh"}
                </span>
                <span>{generatingSummary ? "Regenerating..." : "Refresh"}</span>
              </button>
              <button 
                onClick={() => setShowSummary(false)}
                className="text-xs text-on-surface-variant hover:text-on-surface p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          <div className="text-xs md:text-sm text-on-surface leading-relaxed whitespace-pre-wrap bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 font-sans">
            {concept?.aiSummary || "No summary available yet. Click 'Refresh' to generate one."}
          </div>

          {questions.length === 0 && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleGenerateQuestions()}
                disabled={generating}
                className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-sm ${generating ? "animate-spin" : ""}`}>
                  {generating ? "progress_activity" : "play_arrow"}
                </span>
                <span>{generating ? "Generating 10 Questions..." : "Ready! Generate 10 Quiz Questions"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Quiz Questions Empty State */}
      {questions.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-10 border border-outline-variant/40 text-center flex flex-col items-center justify-center gap-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">auto_awesome</span>
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-xl font-bold text-on-surface">Ready to Quiz on {concept?.name}</h3>
            <p className="text-xs md:text-sm text-on-surface-variant">
              {concept?.notesFileName 
                ? `AI will generate 10 tailored multiple-choice questions based directly on "${concept.notesFileName}".`
                : "Generate 10 multiple-choice questions designed for active recall & memory retention, or upload lecture notes below."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc || generating}
              className="px-4 py-2.5 bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-variant text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-sm ${uploadingDoc ? "animate-spin" : ""}`}>
                {uploadingDoc ? "progress_activity" : "upload_file"}
              </span>
              <span>{uploadingDoc ? "Uploading..." : "Upload Word / PDF / Notes"}</span>
            </button>

            {!concept?.aiSummary && (
              <button
                onClick={() => handleGenerateSummary()}
                disabled={generatingSummary || generating}
                className="px-5 py-2.5 bg-secondary-fixed text-on-secondary-fixed text-xs font-bold rounded-xl hover:brightness-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-sm ${generatingSummary ? "animate-spin" : ""}`}>
                  {generatingSummary ? "progress_activity" : "summarize"}
                </span>
                <span>{generatingSummary ? "Generating Summary..." : "Generate Summary First"}</span>
              </button>
            )}

            <button
              onClick={() => handleGenerateQuestions()}
              disabled={generating || uploadingDoc}
              className="px-6 py-3 bg-primary hover:bg-primary-container text-on-primary text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined ${generating ? "animate-spin" : ""}`}>
                {generating ? "progress_activity" : "auto_awesome"}
              </span>
              <span>{generating ? "Generating 10 Questions..." : (concept?.notesFileName ? "Generate 10 Qs From Notes" : "Generate 10 Questions with AI")}</span>
            </button>
          </div>
        </div>
      ) : submitted && scoreResult ? (
        /* Quiz Results Screen */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-primary/30 shadow-md text-center flex flex-col items-center justify-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-sm ${
              scoreResult.percentage >= 80 ? "bg-emerald-500/10 text-emerald-700 border-2 border-emerald-500" :
              scoreResult.percentage >= 60 ? "bg-amber-500/10 text-amber-700 border-2 border-amber-500" :
              "bg-error-container text-error border-2 border-error"
            }`}>
              {scoreResult.percentage}%
            </div>

            <div>
              <h3 className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>
                {scoreResult.percentage >= 80 ? "🎉 Outstanding Retention!" :
                 scoreResult.percentage >= 60 ? "⚡ Good Effort! Short Review Recommended" :
                 "🚨 High Decay Risk — Review Summary"}
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                You scored <strong className="text-on-surface">{scoreResult.score} of {scoreResult.total} questions</strong> ({scoreResult.percentage}%) in {scoreResult.timeTaken} seconds.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setAnswers({});
                  setCurrentIndex(0);
                  setSubmitted(false);
                  setScoreResult(null);
                  setStartTime(Date.now());
                }}
                className="px-5 py-2.5 bg-surface-container-low hover:bg-surface-variant text-on-surface text-xs font-bold rounded-xl border border-outline-variant transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">replay</span>
                <span>Retake Quiz</span>
              </button>

              <button
                onClick={() => handleGenerateQuestions()}
                disabled={generating}
                className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-sm ${generating ? "animate-spin" : ""}`}>
                  {generating ? "progress_activity" : "auto_awesome"}
                </span>
                <span>{generating ? "Generating 10 Fresh Questions..." : "Generate 10 Fresh Questions"}</span>
              </button>

              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-secondary-fixed text-on-secondary-fixed text-xs font-bold rounded-xl transition-all"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">fact_check</span>
              <span>Detailed Question Review</span>
            </h4>

            {questions.map((q, idx) => {
              const selected = answers[idx];
              const isCorrect = selected === q.correctOptionIndex;

              return (
                <div 
                  key={idx} 
                  className={`p-6 rounded-xl border bg-surface-container-lowest shadow-xs space-y-3 ${
                    isCorrect ? "border-emerald-500/40" : "border-error/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant">
                      Question {idx + 1}
                    </span>
                    <span className={`text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1 ${
                      isCorrect ? "bg-emerald-500/10 text-emerald-700" : "bg-error-container text-error"
                    }`}>
                      <span className="material-symbols-outlined text-xs">
                        {isCorrect ? "check" : "close"}
                      </span>
                      {isCorrect ? "Correct (+1)" : "Incorrect"}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-on-surface">{q.questionText}</p>

                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isOptionCorrect = optIdx === q.correctOptionIndex;
                      const isOptionSelected = optIdx === selected;

                      let optStyle = "bg-surface-container-low border-outline-variant/30 text-on-surface-variant";
                      if (isOptionCorrect) {
                        optStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-900 font-semibold";
                      } else if (isOptionSelected && !isOptionCorrect) {
                        optStyle = "bg-error-container/30 border-error text-error line-through";
                      }

                      return (
                        <div key={optIdx} className={`p-3 rounded-lg text-xs border flex items-center gap-2 ${optStyle}`}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] bg-surface-container">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                          {isOptionCorrect && (
                            <span className="ml-auto text-emerald-700 font-bold text-[10px] uppercase">Correct Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-2 p-3 bg-surface-container-low rounded-lg text-xs text-on-surface-variant border-l-2 border-primary">
                      <strong className="text-on-surface">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Quiz Stepper (10 Questions) */
        <section className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(124,58,237,0.06)] border border-primary/25 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Quiz Header */}
          <div className="flex items-center justify-between relative z-10 border-b border-outline-variant/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-xs">
                {currentIndex + 1}
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">{concept?.name}</h3>
                <p className="text-xs text-on-surface-variant">Question {currentIndex + 1} of {questions.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 bg-surface-container rounded-full text-on-surface-variant">
                {answeredCount}/{questions.length} Answered
              </span>
            </div>
          </div>

          {/* Question Stepper Indicator Bubbles */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 relative z-10">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
                  i === currentIndex
                    ? "bg-primary text-on-primary ring-2 ring-primary/40 shadow-xs scale-110"
                    : answers[i] !== undefined
                    ? "bg-emerald-500/20 text-emerald-700 border border-emerald-500/40"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question Text */}
          <div className="space-y-4 relative z-10">
            <p className="text-base md:text-lg font-medium text-on-surface leading-snug">
              {currentQuestion?.questionText}
            </p>

            {/* 4 Options */}
            <div className="space-y-3 pt-2">
              {currentQuestion?.options.map((opt, optIdx) => {
                const isSelected = answers[currentIndex] === optIdx;

                return (
                  <label 
                    key={optIdx} 
                    onClick={() => selectOption(optIdx)}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary" 
                        : "border-outline-variant/50 hover:bg-surface-container-low hover:border-primary/40"
                    }`}
                  >
                    <input 
                      type="radio" 
                      name={`q-${currentIndex}`} 
                      className="hidden"
                      checked={isSelected}
                      onChange={() => selectOption(optIdx)}
                    />
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                      isSelected 
                        ? "bg-primary text-on-primary" 
                        : "bg-surface-container text-on-surface-variant"
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm text-on-surface font-medium">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30 relative z-10">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-surface-container-low hover:bg-surface-variant text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-on-primary shadow-sm hover:bg-primary-container transition-all flex items-center gap-1"
                >
                  <span>Next Question</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!isComplete || submitting}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={`material-symbols-outlined text-sm ${submitting ? "animate-spin" : ""}`}>
                    {submitting ? "progress_activity" : "check_circle"}
                  </span>
                  <span>{submitting ? "Submitting Quiz..." : `Submit Quiz (${answeredCount}/${questions.length})`}</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
