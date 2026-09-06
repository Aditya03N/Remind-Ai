"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    // This is a mockup since we don't have a PUT /api/users/profile route yet
    toast.success("Profile updated successfully! (Mock)");
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!password || !newPassword) return;
    toast.success("Password updated successfully! (Mock)");
    setPassword("");
    setNewPassword("");
  };

  if (authLoading) return (
    <div className="space-y-6 animate-pulse max-w-2xl mx-auto w-full">
      <div className="h-10 bg-surface-container-low rounded-lg w-1/4"></div>
      <div className="h-64 bg-surface-container-low rounded-2xl w-full"></div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-on-surface" style={{fontFamily: "var(--font-headline-lg)"}}>Settings</h1>
        <p className="text-sm text-on-surface-variant mt-1">Manage your account preferences</p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-outline-variant/30">
          <h2 className="text-xl font-bold text-on-surface mb-6">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xl shadow-md">
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">Profile Picture</p>
                <p className="text-xs text-on-surface-variant">Avatar is generated from your name.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled // Emails usually shouldn't be easily changed without verification
              />
              <p className="text-xs text-on-surface-variant mt-1">Contact support to change your email address.</p>
            </div>
            
            <div className="pt-2">
              <button type="submit" className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-medium rounded-xl shadow-md transition-all text-sm">
                Save Changes
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-on-surface mb-6">Security</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Current Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            
            <div className="pt-2">
              <button type="submit" className="px-6 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-medium border border-outline-variant/50 rounded-xl transition-all text-sm">
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
