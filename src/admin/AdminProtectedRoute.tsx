import React, { useState } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { ShieldAlert, LogOut, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AdminProtectedRoute: React.FC = () => {
  const { user, role, isAdmin, isLoading, signOut, setAdminRoleManually } = useAuth();
  const [elevating, setElevating] = useState(false);
  const [elevationDone, setElevationDone] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07241e] flex items-center justify-center">
        <LoadingSpinner label="Authenticating Administrative Clearance..." />
      </div>
    );
  }

  // Not signed in -> send to admin login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Signed in but not admin role
  if (!isAdmin && role !== 'admin') {
    const handleElevate = async () => {
      setElevating(true);
      const success = await setAdminRoleManually();
      setElevating(false);
      if (success) {
        setElevationDone(true);
        window.location.reload();
      }
    };

    return (
      <div className="min-h-screen bg-[#071310] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-[#0d221d] border border-[#c5a059]/40 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Restricted Admin Area
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6">
            Your authenticated identity (<strong className="text-neutral-200">{user.email}</strong>) is currently designated as a customer (<span className="text-amber-400 font-mono font-bold">{role}</span>). Direct administrative clearance is required.
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 text-left text-xs mb-6 space-y-2">
            <div className="flex items-center gap-2 text-[#dfbe7e] font-bold">
              <KeyRound className="w-4 h-4" />
              <span>Project Owner Authorization</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              If you are the developer or store owner, you can elevate your account to administrative authority:
            </p>
            <button
              onClick={handleElevate}
              disabled={elevating || elevationDone}
              className="w-full mt-2 py-2 px-4 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#07241e] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {elevating ? 'Authorizing in Supabase...' : elevationDone ? 'Authorized! Reloading...' : 'Grant My Account Admin Role'}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={async () => {
                await signOut();
                window.location.href = '/admin/login';
              }}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign In with Different Admin Credentials</span>
            </button>

            <Link
              to="/"
              className="text-xs text-neutral-500 hover:text-white flex items-center justify-center gap-1.5 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Customer Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

