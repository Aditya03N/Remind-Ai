"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: null, message: "" });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setUpdatingProfile(true);
    try {
      const res = await fetchWithAuth("/users/profile", {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Profile updated successfully!");
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify({ ...user, name }));
        }
      } else {
        toast.error(data.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.error("Network error while updating profile.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: null, message: "" });

    // 1. Validate current password entered
    if (!currentPassword.trim()) {
      const msg = "Please enter your current password.";
      setPasswordStatus({ type: "error", message: msg });
      toast.error(msg);
      return;
    }

    // 2. Validate new password length
    if (!newPassword || newPassword.length < 6) {
      const msg = "New password must be at least 6 characters long.";
      setPasswordStatus({ type: "error", message: msg });
      toast.error(msg);
      return;
    }

    // 3. Prevent using same password
    if (currentPassword === newPassword) {
      const msg = "New password cannot be the same as your current password.";
      setPasswordStatus({ type: "error", message: msg });
      toast.error(msg);
      return;
    }

    // 4. Validate confirm password match
    if (newPassword !== confirmPassword) {
      const msg = "New passwords do not match. Please verify and re-type.";
      setPasswordStatus({ type: "error", message: msg });
      toast.error(msg);
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetchWithAuth("/users/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        const successMsg = data.message || "Password updated successfully!";
        toast.success(successMsg);
        setPasswordStatus({
          type: "success",
          message: `${successMsg} Your account is now protected with your new password.`,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errMsg = data.message || "Failed to update password. Please check your current password.";
        toast.error(errMsg);
        setPasswordStatus({ type: "error", message: errMsg });
      }
    } catch (err) {
      const networkMsg = "Network error while updating password. Please ensure backend is running.";
      toast.error(networkMsg);
      setPasswordStatus({ type: "error", message: networkMsg });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-2xl mx-auto w-full">
        <div className="h-10 bg-surface-container-low rounded-lg w-1/4"></div>
        <div className="h-64 bg-surface-container-low rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-8">
      <div>
        <h1
          className="text-3xl font-bold text-on-surface"
          style={{ fontFamily: "var(--font-headline-lg)" }}
        >
          Settings
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage your account profile and password security
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
        {/* Profile Information Section */}
        <div className="p-6 md:p-8 border-b border-outline-variant/30">
          <h2 className="text-xl font-bold text-on-surface mb-6">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xl shadow-md">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">Profile Picture</p>
                <p className="text-xs text-on-surface-variant">
                  Avatar is generated from your display name.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all opacity-75 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-on-surface-variant mt-1">
                Email address is permanently linked to your account.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-medium rounded-xl shadow-md transition-all text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {updatingProfile ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password Section */}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
            <h2 className="text-xl font-bold text-on-surface">Change Password</h2>
          </div>
          <p className="text-xs text-on-surface-variant mb-6">
            Ensure your account stays secure by verifying your current password before choosing a new one.
          </p>

          {/* Inline Alert / Feedback Banner */}
          {passwordStatus.type === "success" && (
            <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">
                check_circle
              </span>
              <div className="flex-1 font-medium leading-relaxed">
                {passwordStatus.message}
              </div>
            </div>
          )}

          {passwordStatus.type === "error" && (
            <div className="mb-5 p-4 bg-error-container/40 border border-error/40 rounded-xl text-error text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-base shrink-0">
                error
              </span>
              <div className="flex-1 font-medium leading-relaxed">
                {passwordStatus.message}
              </div>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* 1. Current Password */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Current Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  placeholder="Enter your current password"
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordStatus.type === "error") setPasswordStatus({ type: null, message: "" });
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-11 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                  title={showCurrentPass ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showCurrentPass ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. New Password */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                New Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  placeholder="Must be at least 6 characters"
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordStatus.type === "error") setPasswordStatus({ type: null, message: "" });
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-11 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                  title={showNewPass ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showNewPass ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* 3. Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Confirm New Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  placeholder="Re-enter your new password"
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordStatus.type === "error") setPasswordStatus({ type: null, message: "" });
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-11 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                  title={showConfirmPass ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showConfirmPass ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={updatingPassword}
                className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl shadow-md transition-all text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {updatingPassword ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying &amp; Updating...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">key</span>
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
