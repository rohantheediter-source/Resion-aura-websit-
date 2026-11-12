import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft, ArrowRight, Lock, Mail, Loader2, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { GoogleLogo } from '../../components/auth/GoogleSignInButton';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signIn, signInWithGoogle, signOut, isLoading, verifyAdminStatus } = useAuth();
  const { error: showToastError, success: showToastSuccess } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleProcessing, setIsGoogleProcessing] = useState(false);

  // If already logged in and server-verified as admin, redirect to admin dashboard
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleGoogleAdminLogin = async () => {
    if (isGoogleProcessing || isSubmitting) return;
    setIsGoogleProcessing(true);
    try {
      sessionStorage.setItem('resin_aura_auth_redirect', '/admin');
      // If currently signed in as a non-admin, clear session first to avoid token conflicts
      if (user && !isAdmin) {
        await signOut();
        sessionStorage.setItem('resin_aura_auth_redirect', '/admin');
      }

      const { error } = await signInWithGoogle('/admin');
      if (error) {
        showToastError(error.message || 'Google authentication could not be initiated.');
        setIsGoogleProcessing(false);
      }
    } catch (err: any) {
      showToastError(err?.message || 'Unexpected error during Google Sign-In.');
      setIsGoogleProcessing(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToastError('Please enter both administrator email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
        showToastError(signInError.message || 'Invalid administrator credentials.');
        setIsSubmitting(false);
        return;
      }

      // Live verification of administrative clearance on server
      const isAuthorizedAdmin = await verifyAdminStatus();
      if (isAuthorizedAdmin) {
        showToastSuccess('Administrative clearance verified. Console unlocked.');
        navigate('/admin');
      } else {
        // Authenticated credentials belong to a non-admin account
        await signOut();
        showToastError('Access Denied: This account is not registered as an administrator.');
      }
    } catch (err: any) {
      showToastError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061713] flex flex-col justify-between py-12 px-4 text-white font-sans">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#dfbe7e]/70 hover:text-[#dfbe7e] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
          SECURE_ADMIN_PORTAL
        </span>
      </div>

      {/* Main Admin Portal Login Card */}
      <div className="max-w-md w-full mx-auto bg-[#0d221d] border border-[#c5a059]/40 rounded-3xl p-8 sm:p-10 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#071713] border-2 border-[#c5a059] text-[#dfbe7e] flex items-center justify-center mx-auto mb-4 shadow-gold-glow">
            <Shield className="w-7 h-7" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#dfbe7e] font-bold font-mono">
            Resin Aura Management
          </span>
          <h1 className="font-display text-2xl font-bold text-white mt-1">
            Admin Portal
          </h1>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            Restricted to authorized studio curators and store administrators. Sign in with Google or administrator credentials.
          </p>
        </div>

        {/* Informational notice if current session is a customer */}
        {user && !isAdmin && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              Currently signed in as customer (<strong className="text-white">{user.email}</strong>). Use your authorized admin Google account or credentials below to access the Admin Portal.
            </p>
          </div>
        )}

        {/* METHOD 1: Google OAuth Sign-In */}
        <div>
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isGoogleProcessing || isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-display text-xs font-bold uppercase tracking-[0.14em] transition-all shadow-md hover:shadow-lg border border-white hover:border-[#dfbe7e] disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
          >
            {isGoogleProcessing ? (
              <>
                <Loader2 className="w-4 h-4 text-[#071915] animate-spin shrink-0" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleLogo className="w-5 h-5 shrink-0" />
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Visual Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-neutral-800" />
            <span className="flex-shrink mx-3 text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
              OR SIGN IN WITH ADMIN CREDENTIALS
            </span>
            <div className="flex-grow border-t border-neutral-800" />
          </div>

          {/* METHOD 2: Existing Admin Email/Password Form */}
          <form onSubmit={handleEmailPasswordLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5 font-mono text-[11px]">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="Enter administrator email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#061713] border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#c5a059] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5 font-mono text-[11px]">
                Administrator Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Enter administrator password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#061713] border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#c5a059] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleProcessing}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#071915] hover:bg-[#0b241e] text-[#dfbe7e] border border-[#c5a059] font-display text-xs font-bold uppercase tracking-[0.16em] transition-all disabled:opacity-50 shadow-sm hover:shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#dfbe7e] animate-spin" />
                  <span>Verifying Clearance...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-800/80 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-neutral-400 font-mono">
            <Shield className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Dual-Method Authentication</span>
          </div>
          <p className="text-[11px] text-neutral-500 leading-normal">
            Supports authorized Google Sign-In and direct administrator credentials. Non-authorized accounts are rejected by server-side authorization controls.
          </p>
        </div>
      </div>

      <div className="text-center text-[11px] text-neutral-500">
        Resin Aura Security Engine • Server-Side Database RLS Enforcement
      </div>
    </div>
  );
};
