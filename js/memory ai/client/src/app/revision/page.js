import Link from "next/link";

export default function RevisionPlan() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>Revision Plan</h1>
          <p className="text-sm text-on-surface-variant mt-1">Your personalized knowledge recovery queue.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.04)] border border-outline-variant/40 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant">
            <tr>
              <th className="px-6 py-4 font-medium">Concept</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Retention</th>
              <th className="px-6 py-4 font-medium">Suggested Time</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            <tr className="hover:bg-surface-container transition-colors">
              <td className="px-6 py-4 font-medium text-on-surface">Linked List</td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5 text-error">
                  <div className="w-2 h-2 rounded-full bg-error"></div> Critical
                </span>
              </td>
              <td className="px-6 py-4 text-on-surface-variant">38%</td>
              <td className="px-6 py-4 text-on-surface-variant">15–20 mins</td>
              <td className="px-6 py-4 text-right">
                <Link href="/concept/1" className="text-primary hover:text-primary-container font-medium">Revise →</Link>
              </td>
            </tr>
            <tr className="hover:bg-surface-container transition-colors">
              <td className="px-6 py-4 font-medium text-on-surface">Merge Sort</td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div> High Risk
                </span>
              </td>
              <td className="px-6 py-4 text-on-surface-variant">52%</td>
              <td className="px-6 py-4 text-on-surface-variant">10–15 mins</td>
              <td className="px-6 py-4 text-right">
                <Link href="/concept/2" className="text-primary hover:text-primary-container font-medium">Revise →</Link>
              </td>
            </tr>
            <tr className="hover:bg-surface-container transition-colors">
              <td className="px-6 py-4 font-medium text-on-surface">Binary Search</td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5 text-amber-600">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div> Moderate
                </span>
              </td>
              <td className="px-6 py-4 text-on-surface-variant">68%</td>
              <td className="px-6 py-4 text-on-surface-variant">5–10 mins</td>
              <td className="px-6 py-4 text-right">
                <Link href="/concept/3" className="text-primary hover:text-primary-container font-medium">Revise →</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
