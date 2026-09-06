export default function Dashboard() {
  return (
    <>
      {/* Top Section: Overall Knowledge Health & Quick Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Knowledge Health Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-container/5 rounded-full pointer-events-none"></div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-on-surface-variant font-medium">Overall Knowledge Health</span>
              <span className="px-2 py-0.5 bg-tertiary-fixed/30 text-on-tertiary-fixed-variant text-xs font-medium rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span> +2.4%
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="text-4xl font-bold text-primary" style={{fontFamily: "var(--font-headline-xl)"}}>78%</span>
              <span className="text-xs text-on-surface-variant">Optimal retention zone</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden flex">
              <div className="bg-primary h-full rounded-full" style={{ width: "78%" }}></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-on-surface-variant">
              <span>Decay rate: Low</span>
              <span>24 active concepts</span>
            </div>
          </div>
        </div>

        {/* Knowledge Overview: Four Small Summary Tiles */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">check_circle</span>
              </div>
              <span className="text-xs text-emerald-700 font-medium">Stable</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>42</span>
              <p className="text-xs text-on-surface-variant mt-0.5">Strong</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">schedule</span>
              </div>
              <span className="text-xs text-amber-700 font-medium">Fading</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>15</span>
              <p className="text-xs text-on-surface-variant mt-0.5">At Risk</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between hover:border-error/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">warning</span>
              </div>
              <span className="text-xs text-error font-medium">Urgent</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>6</span>
              <p className="text-xs text-on-surface-variant mt-0.5">Critical</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 flex flex-col justify-between hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">verified</span>
              </div>
              <span className="text-xs text-primary font-medium">Locked</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>88</span>
              <p className="text-xs text-on-surface-variant mt-0.5">Mastered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Middle Section: Today's Priority Hero Card */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>Immediate Focus</h3>
          <span className="text-xs text-on-surface-variant">AI-Optimized Schedule</span>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(124,58,237,0.08)] border border-primary-container/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col gap-2 max-w-2xl relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span> Critical risk badge
              </span>
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span> Estimated revision time range: 12-15 mins
              </span>
            </div>
            <h4 className="text-3xl font-bold text-on-surface mt-1" style={{fontFamily: "var(--font-headline-lg)"}}>Linked List</h4>
            <p className="text-base text-on-surface-variant">
              Memory trace decay is accelerating rapidly for this concept. Immediate active recall recommended to prevent complete loss.
            </p>
          </div>
          <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-2">
            <button className="px-6 py-3.5 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
              <span>Start Revision</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Section: Today's Revision Plan List */}
      <section className="flex flex-col gap-4 pb-16">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface" style={{fontFamily: "var(--font-headline-sm)"}}>Today's Revision Plan</h3>
          <span className="text-xs text-on-surface-variant">3 concepts queued</span>
        </div>
        <div className="flex flex-col gap-2">
          {/* Item 1 */}
          <div className="bg-surface-container-lowest p-4 md:p-5 rounded-xl border border-outline-variant/40 hover:border-primary/40 transition-all flex items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <div>
                <h5 className="text-sm font-medium text-on-surface">Linked List</h5>
                <p className="text-xs text-on-surface-variant">Estimated time: 15 mins • 38% retention</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-2.5 py-1 bg-error-container text-on-error-container text-xs font-medium rounded-full hidden sm:inline-flex items-center gap-1">
                🔴 Critical
              </span>
              <button className="px-4 py-2 bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface rounded-lg text-sm transition-all">
                Review
              </button>
            </div>
          </div>
          
          {/* Item 2 */}
          <div className="bg-surface-container-lowest p-4 md:p-5 rounded-xl border border-outline-variant/40 hover:border-primary/40 transition-all flex items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">account_tree</span>
              </div>
              <div>
                <h5 className="text-sm font-medium text-on-surface">Merge Sort</h5>
                <p className="text-xs text-on-surface-variant">Estimated time: 10 mins • 52% retention</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 text-xs font-medium rounded-full hidden sm:inline-flex items-center gap-1">
                ⚠️ High Risk
              </span>
              <button className="px-4 py-2 bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface rounded-lg text-sm transition-all">
                Review
              </button>
            </div>
          </div>
          
        </div>
      </section>
    </>
  );
}
