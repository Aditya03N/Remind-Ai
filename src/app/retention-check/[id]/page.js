"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { fetchWithAuth } from "../../../utils/api";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function RetentionCheck() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const isBaseline = mode === "baseline";

  const { user, loading: authLoading } = useAuth();
  
  const [concept, setConcept] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // { questionId, isCorrect, selectedAnswerIndex, timeTaken }
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  
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
          // If no progress (e.g. brand new and baseline), fetch concept directly
          const cRes = await fetchWithAuth(`/learning/concepts/subject/fallback`); // Muted for now, just use params.id
          setConcept({ _id: params.id, name: 'Concept' });
        }
        
        // Fetch quiz questions
        const quizRes = await fetchWithAuth(`/learning/quizzes/concept/${params.id}`);
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          // For baseline, maybe take 5 questions. For revision, take weak ones.
          // For MVP, just take all or max 5 randomly if baseline.
          if (quizData && quizData.questions && quizData.questions.length > 0) {
            let selectedQuestions = quizData.questions;
            if (isBaseline && selectedQuestions.length > 5) {
               selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
            }
            setQuiz({ ...quizData, questions: selectedQuestions });
          }
        }
      } catch (error) {
        toast.error("Failed to load assessment");
        setConcept({ _id: params.id, name: 'Unknown Concept' });
      }
      setLoading(false);
    };

    if (user && params.id) loadConcept();
    else if (!user) setLoading(false);
  }, [user, params.id, isBaseline]);

  const handleNext = async () => {
    if (!quiz || selectedOption === null) return;
    
    const currentQ = quiz.questions[currentQIndex];
    const isCorrect = selectedOption === currentQ.correctOptionIndex;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    
    const newAnswers = [...answers, {
      questionId: currentQ._id,
      isCorrect,
      selectedAnswerIndex: selectedOption,
      timeTaken
    }];
    
    setAnswers(newAnswers);

    if (currentQIndex < quiz.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setStartTime(Date.now());
    } else {
      // Submit all answers
      await submitAllAnswers(newAnswers);
    }
  };

  const submitAllAnswers = async (finalAnswers) => {
    try {
      const res = await fetchWithAuth("/progress/submit-quiz", {
        method: "POST",
        body: JSON.stringify({
          conceptId: params.id,
          quizId: quiz._id,
          answers: finalAnswers,
          isBaseline
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
        <span className="text-on-surface font-medium">{isBaseline ? 'Baseline Assessment' : 'Retention Check'}</span>
      </div>

      <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(124,58,237,0.08)] border border-primary/30 space-y-6 transition-all relative overflow-hidden">
        
        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>done_all</span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>Assessment Complete!</h3>
            <p className="text-lg text-on-surface-variant">Your score: <span className="font-bold text-primary">{result?.score}%</span></p>
            <p className="text-sm text-on-surface-variant">Knowledge Status: <span className="font-bold">{result?.progress?.knowledgeStatus}</span></p>
            
            <div className="pt-6 flex justify-center gap-4">
              <button onClick={() => router.back()} className="px-6 py-2.5 rounded-lg bg-surface-container-highest text-on-surface font-bold hover:bg-surface-variant transition-colors">
                Back to Concept
              </button>
              <Link href="/dashboard" className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-all">
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : !quiz || quiz.questions.length === 0 ? (
          <div className="text-center space-y-4 py-8">
            <span className="material-symbols-outlined text-5xl text-error/80">error</span>
            <h3 className="text-xl font-bold text-on-surface">No Questions Available</h3>
            <p className="text-sm text-on-surface-variant">Please generate questions for this concept using AI or add them manually first.</p>
            <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-primary text-on-primary font-medium rounded-lg">Go Back</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm">
                  {currentQIndex + 1}/{quiz.questions.length}
                </div>
                <h3 className="text-xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>{concept?.name}</h3>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-container rounded-full h-1.5 mb-6">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${((currentQIndex) / quiz.questions.length) * 100}%` }}></div>
            </div>

            <p className="text-lg text-on-surface relative z-10 font-medium leading-relaxed">
              {quiz.questions[currentQIndex].questionText}
            </p>

            <div className="space-y-3 relative z-10 mt-6">
              {quiz.questions[currentQIndex].options.map((opt, i) => {
                const isCorrect = i === quiz.questions[currentQIndex].correctOptionIndex;
                let optionClass = 'border-outline-variant/50 hover:bg-surface-container-low';
                
                if (showExplanation) {
                  if (isCorrect) optionClass = 'border-tertiary bg-tertiary-container/30';
                  else if (selectedOption === i) optionClass = 'border-error bg-error-container/30';
                  else optionClass = 'border-outline-variant/30 opacity-50';
                } else if (selectedOption === i) {
                  optionClass = 'border-primary bg-primary-fixed/10';
                }

                return (
                  <label key={i} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${optionClass}`}>
                    <input 
                      type="radio" 
                      name="assessment" 
                      disabled={showExplanation}
                      className="mt-1 text-primary focus:ring-primary disabled:opacity-50"
                      checked={selectedOption === i}
                      onChange={() => setSelectedOption(i)}
                    />
                    <span className="text-sm text-on-surface">{opt}</span>
                    {showExplanation && isCorrect && <span className="material-symbols-outlined text-tertiary ml-auto text-sm">check_circle</span>}
                    {showExplanation && selectedOption === i && !isCorrect && <span className="material-symbols-outlined text-error ml-auto text-sm">cancel</span>}
                  </label>
                );
              })}
            </div>

            {showExplanation && quiz.questions[currentQIndex].explanation && (
              <div className="mt-6 p-4 bg-primary-container/20 border border-primary/20 rounded-xl animate-in fade-in">
                <h5 className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Explanation</h5>
                <p className="text-sm text-on-surface">{quiz.questions[currentQIndex].explanation}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 relative z-10">
              {!showExplanation ? (
                <button 
                  onClick={() => setShowExplanation(true)}
                  disabled={selectedOption === null}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check Answer
                </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-2"
                >
                  {currentQIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Assessment'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
