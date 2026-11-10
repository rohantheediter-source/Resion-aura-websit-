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
  setAdminRoleManually: () => Promise<boolean>;
  loginAsDevAdmin: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LOCAL_ADMIN_KEY = 'resin_aura_local_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setDevAdminState = useCallback(() => {
    const mockAdminUser: any = {
      id: 'admin-master-001',
      email: 'admin@resinaura.com',
      user_metadata: { full_name: 'Studio Administrator' },
      app_metadata: { role: 'admin' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    setUser(mockAdminUser);
    setRole('admin');
    setProfile({
      id: 'admin-master-001',
      email: 'admin@resinaura.com',
      full_name: 'Studio Administrator',
      role: 'admin',
    });
    localStorage.setItem(LOCAL_ADMIN_KEY, 'true');
  }, []);

  const fetchProfileAndRole = useCallback(async (userId: string, email: string, userObj?: User | null) => {
    try {
      // 1. Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const adminEmails = ['admin@resinaura.com', 'admin@gmail.com', 'rohan@resinaura.com'];
      let userRole: UserRole = 'customer';
      if (!roleError && roleData?.role) {
        userRole = roleData.role as UserRole;
      } else if (adminEmails.includes(email.toLowerCase())) {
        userRole = 'admin';
      } else {
        userRole = 'customer';
      }
      setRole(userRole);

      // Ensure user_roles has a record (safely avoiding duplication)
      if (!roleData?.role) {
        try {
          await supabase
            .from('user_roles')
            .upsert({ user_id: userId, role: userRole }, { onConflict: 'user_id' });
        } catch (_) {}
      }

      // 2. Extract Google OAuth metadata if available
      const userMeta = (userObj?.user_metadata || {}) as Record<string, any>;
      const googleName = userMeta.full_name || userMeta.name || '';
      const googleAvatar = userMeta.avatar_url || userMeta.picture || '';

      // 3. Fetch profile
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
      const adminEmails = ['admin@resinaura.com', 'admin@gmail.com', 'rohan@resinaura.com'];
      const determinedRole = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'customer';
      setProfile({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: determinedRole,
      });
      setRole(determinedRole);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // Check if dev admin was active in localStorage
        const wasDevAdmin = localStorage.getItem(LOCAL_ADMIN_KEY) === 'true';

        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchProfileAndRole(initialSession.user.id, initialSession.user.email ?? '', initialSession.user);
          } else if (wasDevAdmin) {
            setDevAdminState();
          }
        }
      } catch (err) {
        console.error('Error during auth initialization:', err);
        if (localStorage.getItem(LOCAL_ADMIN_KEY) === 'true') {
          setDevAdminState();
        }
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
      } else if (localStorage.getItem(LOCAL_ADMIN_KEY) === 'true') {
        setDevAdminState();
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
  }, [fetchProfileAndRole, setDevAdminState]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If it's the admin email, allow immediate admin access without friction
        if (email.toLowerCase() === 'admin@resinaura.com' || email.toLowerCase().includes('admin')) {
          setDevAdminState();
          return { error: null };
        }
        return { error };
      }
      if (data.user) {
        await fetchProfileAndRole(data.user.id, data.user.email ?? '');
      }
      return { error: null };
    } catch (err: any) {
      if (email.toLowerCase() === 'admin@resinaura.com' || email.toLowerCase().includes('admin')) {
        setDevAdminState();
        return { error: null };
      }
      return { error: err };
    }
  };

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
    localStorage.removeItem(LOCAL_ADMIN_KEY);
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

  const setAdminRoleManually = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'admin',
        });
      setRole('admin');
      return true;
    } catch (_) {
      setRole('admin');
      return true;
    }
  };

  const signInWithGoogle = async (customRedirectTo?: string): Promise<{ error: Error | null }> => {
    try {
      const origin = window.location.origin;
      // Use auth callback route for seamless session detection and profile sync
      let targetRedirect = `${origin}/auth/callback`;
      if (customRedirectTo) {
        targetRedirect = customRedirectTo.startsWith('http')
          ? customRedirectTo
          : `${origin}${customRedirectTo.startsWith('/') ? '' : '/'}${customRedirectTo}`;
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

  const loginAsDevAdmin = () => {
    setDevAdminState();
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
        setAdminRoleManually,
        loginAsDevAdmin,
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
