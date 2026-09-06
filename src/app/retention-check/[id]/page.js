"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { fetchWithAuth } from "../../../utils/api";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function RetentionCheck() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [concept, setConcept] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(100);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadConcept = async () => {
      try {
        const res = await fetchWithAuth(`/progress/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setConcept(data.progress?.conceptId || { _id: params.id, name: 'Concept' });
        } else {
          setConcept({ _id: params.id, name: 'Unknown Concept' });
        }
        
        // Try fetching quiz
        const quizRes = await fetchWithAuth(`/learning/quizzes/concept/${params.id}`);
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          if (quizData && quizData.questions && quizData.questions.length > 0) {
            setQuiz(quizData);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load assessment");
        setConcept({ _id: params.id, name: 'Unknown Concept' });
      }
      setLoading(false);
    };

    if (user && params.id) loadConcept();
    else if (!user) setLoading(false);
  }, [user, params.id]);

  const handleSubmit = async () => {
    let finalScore = score;
    if (quiz) {
      const correctIndex = quiz.questions[0].correctOptionIndex;
      finalScore = quizAnswer === correctIndex ? 100 : 20; // 100 for correct, 20 for incorrect
    }
    
    try {
      const res = await fetchWithAuth("/progress/retention-check", {
        method: "POST",
        body: JSON.stringify({
          conceptId: params.id,
          score: parseInt(finalScore, 10),
          timeTaken: 60 // placeholder 60 seconds
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setSubmitted(true);
        toast.success("Score submitted successfully!");
      } else {
        toast.error("Failed to submit score");
      }
    } catch (error) {
      toast.error("Network error submitting score");
      console.error(error);
    }
  };

  if (authLoading || loading) return (
    <div className="max-w-3xl mx-auto w-full animate-pulse space-y-6">
      <div className="h-10 bg-surface-container-low rounded-lg w-1/4"></div>
      <div className="h-40 bg-surface-container-low rounded-2xl w-full"></div>
      <div className="h-20 bg-surface-container-low rounded-xl w-full"></div>
    </div>
  );
  if (!user) return null;

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
        <Link href={`/dashboard`} className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-on-surface font-medium">Retention Check</span>
      </div>

      <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(124,58,237,0.08)] border border-primary/30 space-y-6 transition-all relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm">
              AI
            </div>
            <h3 className="text-xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>Self-Assessment: {concept?.name || concept?.title}</h3>
          </div>
        </div>

        <p className="text-lg text-on-surface relative z-10">
          {quiz ? quiz.questions[0].questionText : "How well do you remember this concept? Rate your current understanding."}
        </p>

        <div className="space-y-4 relative z-10">
          {quiz ? (
            <div className="space-y-3">
              {quiz.questions[0].options.map((opt, i) => (
                <label key={i} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${quizAnswer === i ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant/50 hover:bg-surface-container-low'}`}>
                  <input 
                    type="radio" 
                    name="assessment" 
                    className="mt-1 text-primary focus:ring-primary"
                    checked={quizAnswer === i}
                    onChange={() => setQuizAnswer(i)}
                  />
                  <span className="text-sm text-on-surface">{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <>
              <input 
                type="range" 
                min="0" max="100" 
                value={score} 
                onChange={(e) => setScore(e.target.value)}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm font-bold text-primary">
                <span>{score}% Retention</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-center text-on-surface-variant">
                <div>Complete Blank (0-30)</div>
                <div>Vague Recall (31-60)</div>
                <div>Solid (61-89)</div>
                <div>Perfect Master (90+)</div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 relative z-10">
          <button 
            onClick={handleSubmit}
            disabled={submitted || (quiz && quizAnswer === null)}
            className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {quiz ? "Verify Recall" : "Submit Score"}
          </button>
        </div>

        {/* Success Notification Banner */}
        {submitted && (
          <div className="mt-8 bg-tertiary-container/10 border border-tertiary-container/30 rounded-xl p-6 flex items-center justify-between text-tertiary animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>done_all</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Neural Pathway Reinforced!</h4>
                <p className="text-xs text-on-surface-variant">Your decay timer has been updated. New Status: {result?.knowledgeStatus}</p>
              </div>
            </div>
            <Link href="/dashboard" className="text-xs text-primary font-semibold hover:underline">Return to Dashboard</Link>
          </div>
        )}
      </section>
    </>
  );
}
