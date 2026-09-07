import Link from "next/link";

export default function ConceptDetails({ params }) {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
        <Link href="/revision" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Revision Plan</span>
        </Link>
        <span>/</span>
        <span className="text-on-surface font-medium">Concept Decay Analysis</span>
      </div>

      <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(124,58,237,0.06)] border border-outline-variant/30 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="text-xs text-primary font-medium tracking-wide uppercase">Active Neural Trace</span>
            <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>Linked List</h1>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-error-container text-on-error-container border border-error/25 self-start sm:self-auto">
            <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>warning</span>
            <span className="text-xs font-semibold">Decaying Rapidly</span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-lg p-5 border border-outline-variant/40 space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <span className="material-symbols-outlined text-base">psychology</span>
            <span>Why revision is recommended now</span>
          </div>
          <p className="text-base text-on-surface-variant leading-relaxed">
            Our predictive memory model indicates that your retention of <strong className="text-on-surface">Linked List</strong> is approaching the active forgetting threshold. Without reinforcement, neural pathway strength for this topic will drop below the retention baseline, requiring significantly more effort to relearn later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 relative z-10">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Suggested Duration</p>
              <p className="text-sm font-bold text-on-surface">15 - 20 minutes</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Decay Velocity</p>
              <p className="text-sm font-bold text-on-surface">High (12% daily drop)</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined">neurology</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Synapse Strength</p>
              <p className="text-sm font-bold text-on-surface">38% Stable</p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-outline-variant/30 relative z-10">
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">lightbulb</span>
            <span>Completing this session restores trace stability.</span>
          </div>
          <Link href={`/retention-check/1`} className="w-full sm:w-auto px-8 py-4 bg-primary-container text-on-primary text-sm font-bold rounded-xl shadow-lg shadow-primary-container/25 hover:bg-primary transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3">
            <span className="material-symbols-outlined">check_circle</span>
            <span>Take Retention Check</span>
          </Link>
        </div>
      </section>
    </>
  );
}
