"use client";
import Link from "next/link";
import { useState } from "react";

export default function RetentionCheck({ params }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer) {
      setSubmitted(true);
      // In real app, POST /api/progress/retention-check
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
        <Link href={`/concept/${params.id}`} className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Concept</span>
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
            <h3 className="text-xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>Micro-Assessment Check</h3>
          </div>
          <span className="text-xs text-primary font-medium px-3 py-1 bg-primary-fixed/30 rounded-full">Question 1 of 1</span>
        </div>

        <p className="text-lg text-on-surface relative z-10">
          Quickly verify your recall: What is the primary advantage of utilizing event logs over shared mutable states in asynchronous distributed microservices?
        </p>

        <div className="space-y-3 relative z-10">
          {[
            { id: 1, text: "It entirely eliminates network latency across independent server clusters." },
            { id: 2, text: "It provides immutable audit trails and decouples services, preventing race conditions." },
            { id: 3, text: "It reduces total storage overhead by compacting memory states automatically." }
          ].map((option) => (
            <label key={option.id} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${selectedAnswer === option.id ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant/50 hover:bg-surface-container-low'}`}>
              <input 
                type="radio" 
                name="assessment" 
                className="mt-1 text-primary focus:ring-primary"
                checked={selectedAnswer === option.id}
                onChange={() => setSelectedAnswer(option.id)}
              />
              <span className="text-sm text-on-surface">{option.text}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2 relative z-10">
          <Link href={`/concept/${params.id}`} className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant text-sm font-medium transition-all">
            Cancel
          </Link>
          <button 
            onClick={handleSubmit}
            disabled={!selectedAnswer || submitted}
            className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify Recall
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
                <h4 className="text-sm font-bold text-on-surface">Neural Pathway Reinforced Successfully!</h4>
                <p className="text-xs text-on-surface-variant">Your decay timer has been reset for the next 14 days.</p>
              </div>
            </div>
            <Link href="/dashboard" className="text-xs text-primary font-semibold hover:underline">Return to Dashboard</Link>
          </div>
        )}
      </section>
    </>
  );
}
