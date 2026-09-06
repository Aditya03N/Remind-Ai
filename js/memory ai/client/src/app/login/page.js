"use client";

import Link from "next/link";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // In a real app, call POST /api/users/login
    window.location.href = "/dashboard";
  };

  const handleOAuthLogin = (provider) => {
    // In a real app, redirect to GET /api/users/oauth/google etc.
    alert(`${provider} OAuth integration not fully set up. Mocking login!`);
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(124,58,237,0.08)] border border-outline-variant/40 p-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">psychology</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>Welcome back</h2>
          <p className="text-sm text-on-surface-variant mt-2">Log in to track your knowledge decay.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
              <span className="text-xs text-on-surface-variant">Remember me</span>
            </label>
            <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>
          </div>

          <button type="submit" className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl shadow-md transition-all mt-4">
            Sign In
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-surface-container-lowest text-on-surface-variant">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => handleOAuthLogin('Google')} className="flex items-center justify-center gap-2 py-2.5 border border-outline-variant/50 rounded-xl hover:bg-surface-container transition-all text-sm font-medium text-on-surface">
              Google
            </button>
            <button onClick={() => handleOAuthLogin('GitHub')} className="flex items-center justify-center gap-2 py-2.5 border border-outline-variant/50 rounded-xl hover:bg-surface-container transition-all text-sm font-medium text-on-surface">
              GitHub
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-on-surface-variant">
          Don't have an account? <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
