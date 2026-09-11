"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function AppLayoutWrapper({ children }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace("/login");
    }
  }, [user, loading, isAuthPage, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-lg animate-pulse mb-3">
          <span className="material-symbols-outlined text-3xl">psychology</span>
        </div>
        <p className="text-sm font-medium text-on-surface-variant">
          Checking session...
        </p>
      </div>
    );
  }

  // Auth pages or Unauthenticated: Full-screen simple container without sidebar or header
  if (!user || isAuthPage) {
    return (
      <main className="flex-1 w-full min-h-screen flex flex-col justify-center items-center bg-surface px-4 py-8">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        {children}
      </main>
    );
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/subjects", label: "Subjects", icon: "library_books" },
    { href: "/revision", label: "Revision Plan", icon: "event_note" },
    { href: "/mastery", label: "Mastery", icon: "verified" },
    { href: "/planner", label: "Manual Planner", icon: "edit_calendar" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-surface">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* SideNavBar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col justify-between p-4 z-50 bg-surface-container border-r border-outline-variant transition-transform duration-300 ease-in-out ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
              <div>
                <h1
                  className="text-xl font-extrabold text-on-surface"
                  style={{ fontFamily: "var(--font-headline-md)" }}
                >
                  Revision.ai
                </h1>
                <p className="text-xs text-on-surface-variant">
                  Knowledge Decay System
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "text-primary font-bold bg-primary-container/20 border-l-4 border-primary pl-3"
                      : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={logout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-error hover:bg-error-container/40 transition-all duration-200 mt-2 text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </nav>
        </div>

        {/* User Card in Sidebar */}
        <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-3 border border-outline-variant/40">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-on-surface truncate">
              {user?.name || "Student"}
            </p>
            <p className="text-xs text-on-surface-variant truncate">
              {user?.email || "learner@revision.ai"}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <header className="bg-surface/90 flex justify-between items-center w-full px-6 py-4 sticky top-0 z-30 backdrop-blur-md border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-on-surface"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">
                  search
                </span>
              </span>
              <input
                className="w-64 pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Search concepts..."
                type="text"
              />
            </div>
            <Link
              href="/revision"
              className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant relative transition-colors"
              title="View Revision Queue"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-8">
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          {children}
        </main>
      </div>
    </div>
  );
}
