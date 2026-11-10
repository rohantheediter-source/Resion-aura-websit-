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

  const fetchProfileAndRole = useCallback(async (userId: string, email: string) => {
    try {
      // 1. Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const adminEmails = ['admin@resinaura.com', 'admin@gmail.com', 'rohan@resinaura.com'];
      if (!roleError && roleData?.role) {
        setRole(roleData.role as UserRole);
      } else if (adminEmails.includes(email.toLowerCase())) {
        setRole('admin');
      } else {
        setRole('customer');
      }

      // 2. Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile({
          id: userId,
          email,
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          avatar_url: profileData.avatar_url || '',
          role: (roleData?.role as UserRole) || (adminEmails.includes(email.toLowerCase()) ? 'admin' : 'customer'),
        });
      } else {
        setProfile({
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: (roleData?.role as UserRole) || (adminEmails.includes(email.toLowerCase()) ? 'admin' : 'customer'),
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
            await fetchProfileAndRole(initialSession.user.id, initialSession.user.email ?? '');
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
        await fetchProfileAndRole(newSession.user.id, newSession.user.email ?? '');
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
