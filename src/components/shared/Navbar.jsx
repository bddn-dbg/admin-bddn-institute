import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../firebase/auth";
import { useAuth } from "../../App";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAdmin();
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinks = [
    { to: "/", label: "📊 Dashboard" },
    { to: "/batches", label: "📁 Batches" },
    { to: "/resources", label: "📚 admin-resourses" },
  ];

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="BDDN Logo"
              className="w-8 h-8 rounded-lg object-cover shadow-sm border border-slate-100"
            />
            <div>
              <span className="font-bold text-slate-800 text-sm">BDDN Admin</span>
              <span className="hidden sm:inline text-slate-400 text-xs ml-2">
                Admission Panel
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  location.pathname === link.to
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-slate-500 truncate max-w-[150px]">
              {user?.email}
            </span>
            <button
              id="logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {loggingOut ? "..." : "🚪 Logout"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
