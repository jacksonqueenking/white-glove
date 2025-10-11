'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthUser, AuthSession } from './types';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
          expires_in: session.expires_in || 0,
          user: {
            id: session.user.id,
            email: session.user.email!,
            user_metadata: session.user.user_metadata as any,
            created_at: session.user.created_at!,
            last_sign_in_at: session.user.last_sign_in_at,
          },
        });
        setUser({
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata as any,
          created_at: session.user.created_at!,
          last_sign_in_at: session.user.last_sign_in_at,
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
          expires_in: session.expires_in || 0,
          user: {
            id: session.user.id,
            email: session.user.email!,
            user_metadata: session.user.user_metadata as any,
            created_at: session.user.created_at!,
            last_sign_in_at: session.user.last_sign_in_at,
          },
        });
        setUser({
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata as any,
          created_at: session.user.created_at!,
          last_sign_in_at: session.user.last_sign_in_at,
        });
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
