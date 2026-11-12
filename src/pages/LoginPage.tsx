import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { GoogleSignInButton, AuthDivider } from '../components/auth/GoogleSignInButton';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn, user, isLoading } = useAuth();
  const { error, success } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine intended destination
  const getReturnUrl = (): string => {
    return (
      searchParams.get('redirect') ||
      (location.state as any)?.from?.pathname ||
      (location.state as any)?.from ||
      sessionStorage.getItem('resin_aura_auth_redirect') ||
      '/profile'
    );
  };

  // Keep sessionStorage in sync so OAuth redirect preserves destination
  useEffect(() => {
    const redirectParam = searchParams.get('redirect') || (location.state as any)?.from?.pathname || (location.state as any)?.from;
    if (redirectParam) {
      sessionStorage.setItem('resin_aura_auth_redirect', redirectParam);
    }
  }, [searchParams, location]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      const returnUrl = getReturnUrl();
      sessionStorage.removeItem('resin_aura_auth_redirect');
      navigate(returnUrl, { replace: true });
    }
  }, [user, isLoading, navigate, location, searchParams]);

  // Capture OAuth errors passed via URL params
  useEffect(() => {
    const errorParam =
      searchParams.get('error_description') ||
      searchParams.get('error');
    if (errorParam) {
      error(decodeURIComponent(errorParam.replace(/\+/g, ' ')));
    }
  }, [searchParams, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
        error(signInError.message || 'Invalid email or password');
      } else {
        success('Welcome back to Resin Aura');
        const returnUrl = getReturnUrl();
        sessionStorage.removeItem('resin_aura_auth_redirect');
        navigate(returnUrl);
      }
    } catch (err: any) {
      error(err.message || 'An unexpected error occurred during sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheckoutRedirect = searchParams.get('redirect') === '/checkout' || (location.state as any)?.from?.pathname === '/checkout';

  return (
    <div className="bg-[#FAF8F5] min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-luxury">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] mb-4 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#07241e]">
            Collector Sign In
          </h1>
          <p className="font-serif-luxury text-sm text-neutral-500 mt-1">
            Access your saved curations, commission history, and priority dispatch updates.
          </p>
        </div>

        {/* Notice if redirected from checkout */}
        {isCheckoutRedirect && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#0b3b33]/5 border border-[#0b3b33]/20 flex items-center gap-3 text-xs text-[#07241e]">
            <Sparkles className="w-4 h-4 text-[#856338] shrink-0" />
            <span>Please sign in to proceed with checkout. Your bag items have been safely preserved.</span>
          </div>
        )}

        {/* 1. Google OAuth Authentication Button */}
        <div className="mb-1">
          <GoogleSignInButton
            text="Continue with Google"
            redirectTo="/auth/callback"
          />
        </div>

        {/* 2. Visual Luxury Divider */}
        <AuthDivider label="OR CONTINUE WITH EMAIL" />

        {/* 3. Existing Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="patron@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-[#856338] hover:text-[#0b3b33] font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#f7f4ee] font-display text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-md hover:shadow-lg border border-[#c5a059]/40 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Verifying...' : 'Sign In To Account'}</span>
            <ArrowRight className="w-4 h-4 text-[#dfbe7e]" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-500">
          <span>New to Resin Aura? </span>
          <Link
            to={searchParams.get('redirect') ? `/register?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : '/register'}
            state={location.state}
            className="font-bold text-[#0b3b33] hover:underline"
          >
            Create an Account
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-[#0b3b33] font-medium transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Store Administrator? Sign In to Admin Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};


