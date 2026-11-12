import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { supabase } from '../services/supabase';

export const AdminProtectedRoute: React.FC = () => {
  const { user, role, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [isVerifyingServer, setIsVerifyingServer] = useState<boolean>(true);
  const [isServerAuthorized, setIsServerAuthorized] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function checkServerClearance() {
      if (!user) {
        if (isMounted) {
          setIsVerifyingServer(false);
          setIsServerAuthorized(false);
        }
        return;
      }

      setIsVerifyingServer(true);

      try {
        // Direct server-side clearance verification RPC (bypasses any client state manipulation)
        let serverConfirmed = false;

        // Try the clearance sync RPC first
        const { data: clearanceData, error: clearanceErr } = await supabase.rpc('verify_admin_clearance');
        if (!clearanceErr && clearanceData?.is_admin === true) {
          serverConfirmed = true;
        } else {
          // Fallback to core is_admin RPC
          const { data: isAdminData, error: isAdminErr } = await supabase.rpc('is_admin');
          if (!isAdminErr && isAdminData === true) {
            serverConfirmed = true;
          } else {
            // Also check user_roles table for existing admin email/password accounts
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle();

            if (roleData?.role === 'admin') {
              serverConfirmed = true;
            }
          }
        }

        if (isMounted) {
          setIsServerAuthorized(serverConfirmed);
          setIsVerifyingServer(false);
        }
      } catch (err) {
        console.error('Server administrative clearance check failed:', err);
        if (isMounted) {
          setIsServerAuthorized(false);
          setIsVerifyingServer(false);
        }
      }
    }

    if (!isLoading) {
      checkServerClearance();
    }
  }, [user, isLoading]);

  // Auth context initialization loading
  if (isLoading || isVerifyingServer) {
    return (
      <div className="min-h-screen bg-[#061411] flex items-center justify-center">
        <LoadingSpinner label="Verifying Server Administrative Clearance..." />
      </div>
    );
  }

  // Not signed in -> send to admin login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Signed in but rejected by server authorization
  if (!isServerAuthorized || (!isAdmin && role !== 'admin')) {
    const handleSwitchAccount = async () => {
      await signOut();
      sessionStorage.setItem('resin_aura_auth_redirect', '/admin');
      navigate('/admin/login');
    };

    return (
      <div className="min-h-screen bg-[#061411] flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-[#0d221d] border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/30 text-[10px] uppercase tracking-widest text-red-300 font-mono mb-3">
            <span>Clearance Denied</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Restricted Admin Area
          </h1>

          <p className="text-xs text-neutral-300 leading-relaxed mb-6">
            The authenticated Google identity (<strong className="text-white font-semibold">{user.email}</strong>) is not recognized as an authorized administrator in the server registry.
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 text-left text-xs mb-6 space-y-2">
            <div className="flex items-center gap-2 text-[#dfbe7e] font-bold">
              <Shield className="w-4 h-4" />
              <span>Administrative Access Policy</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Resin Aura strictly restricts management functions. Access is verified on the backend via server-side database access controls. Only explicitly whitelisted administrator Google accounts can access this portal.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSwitchAccount}
              className="w-full py-3 rounded-xl bg-[#c5a059] hover:bg-[#dfbe7e] text-[#071915] font-display text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign In with Authorized Google Account</span>
            </button>

            <Link
              to="/"
              className="text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 pt-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Customer Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fully authenticated and server-verified administrator
  return <Outlet />;
};
