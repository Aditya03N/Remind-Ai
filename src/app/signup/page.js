"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      const res = await register(name, email, password);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setError(res.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(124,58,237,0.08)] border border-outline-variant/40 p-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">psychology</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-md)"}}>Create an Account</h2>
          <p className="text-sm text-on-surface-variant mt-2">Start fighting knowledge decay today.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-error-container/40 border border-error/30 rounded-xl flex items-center gap-3 text-error text-sm">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Aditya Anande"
              required
            />
          </div>
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

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl shadow-md transition-all mt-6 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-on-surface-variant">
          Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
