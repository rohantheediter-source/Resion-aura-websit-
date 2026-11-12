import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { GoogleSignInButton, AuthDivider } from '../components/auth/GoogleSignInButton';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signUp, user, isLoading } = useAuth();
  const { error, success } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (!fullName.trim() || !email.trim() || !password) {
      error('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: signUpError } = await signUp(email.trim(), password, fullName.trim());
      if (signUpError) {
        error(signUpError.message || 'Registration failed');
      } else {
        success('Account created successfully! Welcome to Resin Aura.');
        const returnUrl = getReturnUrl();
        sessionStorage.removeItem('resin_aura_auth_redirect');
        navigate(returnUrl);
      }
    } catch (err: any) {
      error(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-luxury">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0b3b33] text-[#dfbe7e] border border-[#c5a059] mb-4 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#07241e]">
            Join The Atelier Circle
          </h1>
          <p className="font-serif-luxury text-sm text-neutral-500 mt-1">
            Create your collector profile to track bespoke orders and curate your wishlist.
          </p>
        </div>

        {/* 1. Google OAuth Registration Button */}
        <div className="mb-1">
          <GoogleSignInButton
            text="Register with Google"
            redirectTo="/auth/callback"
          />
        </div>

        {/* 2. Visual Luxury Divider */}
        <AuthDivider label="OR REGISTER WITH EMAIL" />

        {/* 3. Existing Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Collector or Gifting Name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Password (Min 6 Characters) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Create a password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#0b3b33]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0b3b33] hover:bg-[#07241e] text-[#f7f4ee] font-display text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-md hover:shadow-lg border border-[#c5a059]/40 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Creating Profile...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4 text-[#dfbe7e]" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-500">
          <span>Already registered with Resin Aura? </span>
          <Link
            to={searchParams.get('redirect') ? `/login?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : '/login'}
            state={location.state}
            className="font-bold text-[#0b3b33] hover:underline"
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};


