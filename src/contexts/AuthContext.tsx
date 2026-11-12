import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  verifyAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Server-authoritative role verification: queries database RLS & is_admin RPC
  const fetchProfileAndRole = useCallback(async (userId: string, email: string, userObj?: User | null) => {
    try {
      // 1. Query the database server for admin authorization clearance
      let verifiedIsAdmin = false;
      try {
        // Try the clearance sync RPC first
        const { data: clearanceData, error: clearanceError } = await supabase.rpc('verify_admin_clearance');
        if (!clearanceError && clearanceData) {
          verifiedIsAdmin = clearanceData.is_admin === true;
        } else {
          // Fallback to core is_admin RPC
          const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
          if (!isAdminError && isAdminData === true) {
            verifiedIsAdmin = true;
          }
        }
      } catch {
        verifiedIsAdmin = false;
      }

      // 2. Fetch role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      let userRole: UserRole = 'customer';
      if (verifiedIsAdmin || roleData?.role === 'admin') {
        userRole = 'admin';
      } else if (roleData?.role === 'editor') {
        userRole = 'editor';
      } else {
        userRole = 'customer';
      }
      setRole(userRole);

      // 3. Extract Google OAuth metadata if available
      const userMeta = (userObj?.user_metadata || {}) as Record<string, any>;
      const googleName = userMeta.full_name || userMeta.name || '';
      const googleAvatar = userMeta.avatar_url || userMeta.picture || '';

      // 4. Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        // Enrich profile with Google metadata if local values are blank
        const updatesToSync: Record<string, any> = {};
        if (!profileData.full_name && googleName) updatesToSync.full_name = googleName;
        if (!profileData.avatar_url && googleAvatar) updatesToSync.avatar_url = googleAvatar;

        if (Object.keys(updatesToSync).length > 0) {
          try {
            await supabase
              .from('profiles')
              .update(updatesToSync)
              .eq('id', userId);
          } catch (_) {}
        }

        setProfile({
          id: userId,
          email,
          full_name: profileData.full_name || googleName || '',
          phone: profileData.phone || '',
          avatar_url: profileData.avatar_url || googleAvatar || '',
          role: userRole,
          created_at: profileData.created_at,
        });
      } else {
        // Create new profile for Google / first-time user
        const initialName = googleName || email.split('@')[0];
        try {
          await supabase.from('profiles').upsert({
            id: userId,
            email,
            full_name: initialName,
            avatar_url: googleAvatar,
          }, { onConflict: 'id' });
        } catch (_) {}

        // Initialize customer wishlist
        try {
          await supabase.from('wishlists').upsert({
            user_id: userId,
          }, { onConflict: 'user_id' });
        } catch (_) {}

        setProfile({
          id: userId,
          email,
          full_name: initialName,
          avatar_url: googleAvatar,
          role: userRole,
        });
      }
    } catch (err) {
      console.warn('Error fetching user profile/role:', err);
      // Safe default: customer role, never elevated to admin on error
      setRole('customer');
      setProfile({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: 'customer',
      });
    }
  }, []);

  // Live real-time check of admin status against the backend security RPC
  const verifyAdminStatus = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data: clearanceData, error: clearanceErr } = await supabase.rpc('verify_admin_clearance');
      if (!clearanceErr && clearanceData?.is_admin === true) {
        setRole('admin');
        return true;
      }
      const { data: isAdminData, error: isAdminErr } = await supabase.rpc('is_admin');
      if (!isAdminErr && isAdminData === true) {
        setRole('admin');
        return true;
      }

      // Check user_roles table for existing admin email/password accounts
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData?.role === 'admin') {
        setRole('admin');
        return true;
      }

      setRole('customer');
      return false;
    } catch {
      return false;
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    // Purge any legacy insecure development keys from browser storage
    try {
      localStorage.removeItem('resin_aura_local_admin_session');
      localStorage.removeItem('resin_aura_admin_session');
    } catch (_) {}

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchProfileAndRole(initialSession.user.id, initialSession.user.email ?? '', initialSession.user);
          }
        }
      } catch (err) {
        console.error('Error during auth initialization:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        await fetchProfileAndRole(newSession.user.id, newSession.user.email ?? '', newSession.user);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole('customer');
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndRole]);

  // Customer email & password sign-in (strictly uses Supabase Auth, zero bypass)
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error };
      }
      if (data.user) {
        await fetchProfileAndRole(data.user.id, data.user.email ?? '');
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Customer registration
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (!error && data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: fullName,
          });
        } catch (_) {}
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      sessionStorage.removeItem('resin_aura_auth_redirect');
      localStorage.removeItem('resin_aura_local_admin_session');
    } catch (_) {}

    try {
      await supabase.auth.signOut();
    } catch (_) {}

    setUser(null);
    setSession(null);
    setProfile(null);
    setRole('customer');
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('User not logged in') };
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      if (!error) {
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndRole(user.id, user.email ?? '');
    }
  };

  // Google OAuth sign-in via Supabase
  const signInWithGoogle = async (customRedirectTo?: string): Promise<{ error: Error | null }> => {
    try {
      const origin = window.location.origin;
      const targetRedirect = `${origin}/auth/callback`;

      if (customRedirectTo) {
        sessionStorage.setItem('resin_aura_auth_redirect', customRedirectTo);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetRedirect,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAdmin: role === 'admin',
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile,
        refreshProfile,
        verifyAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
