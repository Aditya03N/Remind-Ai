import Link from "next/link";

export default function Mastery() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>Mastery &amp; Progress History</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track long-term knowledge retention and view concept maturation timelines.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface text-sm font-medium rounded-xl transition-colors flex items-center space-x-2">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            <span>Filter Status</span>
          </button>
          <button className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-xl shadow-sm transition-all flex items-center space-x-2">
            <span className="material-symbols-outlined text-sm">psychology</span>
            <span>Run AI Decay Check</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Overall Retention</span>
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>trending_up</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>94.2%</div>
            <p className="text-xs text-tertiary-container mt-1">+2.4% from last week</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Mastered Concepts</span>
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>4</div>
            <p className="text-xs text-on-surface-variant mt-1">12 pending review</p>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary-container text-on-primary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>Mastered Concepts</h2>
              <p className="text-xs text-on-surface-variant">Permanently consolidated knowledge nodes secured against decay.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Concept 1 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
            <div className="absolute top-4 right-4 text-primary bg-primary-fixed/50 p-2 rounded-full">
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            </div>
            <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-medium">Computer Science</span>
            <h3 className="text-lg font-bold text-on-surface mt-4" style={{fontFamily: "var(--font-headline-sm)"}}>Recursion</h3>
            <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
              <span>Retention: 99.8%</span>
              <span className="text-primary font-medium">Secured</span>
            </div>
          </div>

          {/* Concept 2 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
            <div className="absolute top-4 right-4 text-primary bg-primary-fixed/50 p-2 rounded-full">
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            </div>
            <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-medium">Computer Science</span>
            <h3 className="text-lg font-bold text-on-surface mt-4" style={{fontFamily: "var(--font-headline-sm)"}}>Hash Tables</h3>
            <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
              <span>Retention: 98.4%</span>
              <span className="text-primary font-medium">Secured</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
