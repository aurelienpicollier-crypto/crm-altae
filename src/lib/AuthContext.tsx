import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user:                User | null;
  session:             Session | null;
  loading:             boolean;
  needsPasswordSetup:  boolean;
  signIn:              (email: string, password: string) => Promise<string | null>;
  signOut:             () => Promise<void>;
  updatePassword:      (password: string) => Promise<string | null>;
  sendPasswordReset:   (email: string) => Promise<string | null>;
  clearPasswordSetup:  () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function hasAuthTokenInHash() {
  const hash = window.location.hash;
  return hash.includes('type=invite') || hash.includes('type=recovery');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,               setUser]               = useState<User | null>(null);
  const [session,            setSession]            = useState<Session | null>(null);
  const [loading,            setLoading]            = useState(true);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      // Detect invite/recovery token in URL hash on initial load
      if (data.session && hasAuthTokenInHash()) {
        setNeedsPasswordSetup(true);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordSetup(true);
      }
      if (event === 'SIGNED_IN' && hasAuthTokenInHash()) {
        setNeedsPasswordSetup(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async function updatePassword(password: string): Promise<string | null> {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? error.message : null;
  }

  async function sendPasswordReset(email: string): Promise<string | null> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/set-password',
    });
    return error ? error.message : null;
  }

  function clearPasswordSetup() {
    setNeedsPasswordSetup(false);
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading, needsPasswordSetup,
      signIn, signOut, updatePassword, sendPasswordReset, clearPasswordSetup,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
