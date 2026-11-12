import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const { success, error } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      // 1. Check for error in query params or URL hash
      const searchParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));

      const errDesc =
        searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error');

      const targetRedirect = sessionStorage.getItem('resin_aura_auth_redirect') || '/profile';
      const isForAdmin = targetRedirect.startsWith('/admin');

      if (errDesc) {
        const decoded = decodeURIComponent(errDesc.replace(/\+/g, ' '));
        if (isMounted) {
          setErrorMessage(decoded);
          error(decoded);
          sessionStorage.removeItem('resin_aura_auth_redirect');
          setTimeout(() => navigate(isForAdmin ? '/admin/login' : '/login', { replace: true }), 2500);
        }
        return;
      }

      // 2. Fetch session from Supabase
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          await refreshProfile();
          if (isMounted) {
            sessionStorage.removeItem('resin_aura_auth_redirect');
            if (isForAdmin) {
              success('Authenticated with Google. Verifying administrative clearance...');
            } else {
              success('Signed in with Google successfully! Welcome to Resin Aura.');
            }
            navigate(targetRedirect, { replace: true });
          }
          return;
        }

        // Wait up to 3 seconds for onAuthStateChange to capture the session
        const timeout = setTimeout(() => {
          if (isMounted && !user) {
            sessionStorage.removeItem('resin_aura_auth_redirect');
            navigate(targetRedirect, { replace: true });
          }
        }, 3000);

        return () => clearTimeout(timeout);
      } catch (err: any) {
        console.error('OAuth Callback processing error:', err);
        if (isMounted) {
          const msg = err.message || 'Authentication failed. Please try signing in again.';
          setErrorMessage(msg);
          error(msg);
          sessionStorage.removeItem('resin_aura_auth_redirect');
          setTimeout(() => navigate(isForAdmin ? '/admin/login' : '/login', { replace: true }), 2500);
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [location, navigate, user, refreshProfile, success, error]);

  return (
    <div className="bg-[#FAF8F5] min-h-[75vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-luxury text-center">
        {errorMessage ? (
          <div className="animate-fade-in">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="font-display text-xl font-bold text-neutral-900 mb-2">
              Authentication Notice
            </h1>
            <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
              {errorMessage}
            </p>
            <p className="text-[11px] text-neutral-400">
              Redirecting you to the sign-in page...
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] mb-4 shadow-sm relative">
              <Sparkles className="w-6 h-6" />
              <Loader2 className="w-8 h-8 text-[#c5a059] animate-spin absolute -top-1 -right-1" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#07241e] mb-2">
              Authenticating With Google
            </h1>
            <p className="font-serif-luxury text-sm text-neutral-500 mb-6">
              Verifying your collector credentials and synchronizing your atelier preferences...
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#856338]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Finalizing Session</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

