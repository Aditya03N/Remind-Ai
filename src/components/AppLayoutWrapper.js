"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";

export default function AppLayoutWrapper({ children }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || isAuthPage) {
    return (
      <main className="flex-1 w-full mx-auto flex flex-col">
        {children}
      </main>
    );
  }

  return (
    <>
      {/* SideNavBar for Desktop (hidden md:flex) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col justify-between p-4 z-40 bg-surface-container border-r border-outline-variant">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>Recall.ai</h1>
              <p className="text-xs text-on-surface-variant">Knowledge Decay System</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1">
            <Link href="/dashboard" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === '/dashboard' ? 'text-primary font-bold bg-primary-container/20' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined" style={{fontVariationSettings: pathname === '/dashboard' ? "'FILL' 1" : "'FILL' 0"}}>dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <Link href="/subjects" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${pathname.startsWith('/subjects') ? 'text-primary font-bold bg-primary-container/20' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined" style={{fontVariationSettings: pathname.startsWith('/subjects') ? "'FILL' 1" : "'FILL' 0"}}>library_books</span>
              <span className="text-sm font-medium">Subjects</span>
            </Link>
            <Link href="/revision" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === '/revision' ? 'text-primary font-bold bg-primary-container/20' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined" style={{fontVariationSettings: pathname === '/revision' ? "'FILL' 1" : "'FILL' 0"}}>event_note</span>
              <span className="text-sm font-medium">Revision Plan</span>
            </Link>
            <Link href="/mastery" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === '/mastery' ? 'text-primary font-bold bg-primary-container/20' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined" style={{fontVariationSettings: pathname === '/mastery' ? "'FILL' 1" : "'FILL' 0"}}>verified</span>
              <span className="text-sm font-medium">Mastery</span>
            </Link>
            <Link href="/planner" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === '/planner' ? 'text-primary font-bold bg-primary-container/20' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined" style={{fontVariationSettings: pathname === '/planner' ? "'FILL' 1" : "'FILL' 0"}}>edit_calendar</span>
              <span className="text-sm font-medium">Manual Planner</span>
            </Link>
            <Link href="/settings" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === '/settings' ? 'text-primary font-bold bg-primary-container/20' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined" style={{fontVariationSettings: pathname === '/settings' ? "'FILL' 1" : "'FILL' 0"}}>settings</span>
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-all duration-200">
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </nav>
        </div>
        
        <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-4 border border-outline-variant/30">
          <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-on-surface truncate">{user.name}</p>
            <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <header className="bg-surface/80 flex justify-between items-center w-full px-6 py-4 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-lg hover:bg-surface-variant text-on-surface">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">search</span>
              </span>
              <input className="w-64 pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Search concepts..." type="text"/>
            </div>
            <button className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-12">
          {children}
        </main>
      </div>
    </>
  );
}
