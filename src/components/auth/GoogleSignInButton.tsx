import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface GoogleSignInButtonProps {
  text?: string;
  redirectTo?: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (errorMsg: string) => void;
}

export const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 shrink-0' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const AuthDivider: React.FC<{ label?: string }> = ({ label = 'OR CONTINUE WITH EMAIL' }) => (
  <div className="relative my-6 select-none">
    <div className="absolute inset-0 flex items-center" aria-hidden="true">
      <div className="w-full border-t border-neutral-200" />
    </div>
    <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
      <span className="bg-white px-3 text-neutral-400 font-sans">
        {label}
      </span>
    </div>
  </div>
);

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  text = 'Continue with Google',
  redirectTo,
  className = '',
  disabled = false,
  onSuccess,
  onError,
}) => {
  const { signInWithGoogle } = useAuth();
  const { error: showToastError } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (isProcessing || disabled) return;
    setIsProcessing(true);
    try {
      const { error } = await signInWithGoogle(redirectTo);
      if (error) {
        const errorMsg = error.message || 'Failed to initialize Google authentication';
        if (onError) {
          onError(errorMsg);
        } else {
          showToastError(errorMsg);
        }
        setIsProcessing(false);
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'An unexpected error occurred with Google Sign-In';
      if (onError) {
        onError(errorMsg);
      } else {
        showToastError(errorMsg);
      }
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      aria-label={text}
      className={`w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white hover:bg-[#FAF8F5] text-neutral-800 hover:text-neutral-950 font-display text-xs font-bold uppercase tracking-[0.14em] transition-all shadow-sm hover:shadow-md border border-neutral-300 hover:border-[#c5a059] disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#0b3b33]/20 ${className}`}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 text-[#0b3b33] animate-spin shrink-0" />
          <span className="text-neutral-600">Connecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleLogo />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

