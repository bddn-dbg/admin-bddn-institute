import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginAdmin } from "../../firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await loginAdmin(email.trim(), password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      const msg =
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
          ? "Invalid email or password. Please try again."
          : err.code === "auth/too-many-requests"
          ? "Too many attempts. Please wait and try again."
          : "Login failed. Please contact admin.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4 text-center border border-white/20">
          <img
            src="/logo.jpg"
            alt="BDDN Logo"
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 shadow-lg border border-white/20"
          />
          <h1 className="text-2xl font-bold text-white">BDDN Institute</h1>
          <p className="text-brand-200 text-sm mt-1">Bihar Digital Data & Network</p>
          <p className="text-brand-300 text-xs mt-1">Darbhanga, Bihar</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Admin Login</h2>
          <p className="text-slate-500 text-sm mb-6">
            Sign in to access the Admission Panel
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-red-500 text-lg leading-none mt-0.5">⚠️</span>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="field-group">
              <label className="field-label" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className="field-input"
                placeholder="admin@bddn.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className="field-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn-primary w-full justify-center text-base py-3 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Signing in...
                </>
              ) : (
                "Sign In to Admin Panel"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Restricted to authorized BDDN staff only
          </p>
        </div>
      </div>
    </div>
  );
}
