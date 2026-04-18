import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const result = await supabase.auth.signUp({ email, password });
    return result;
  };

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return result;
  };

  const signOut = async () => {
    const result = await supabase.auth.signOut();
    return result;
  };

  const resetPassword = async (email) => {
    const result = await supabase.auth.resetPasswordForEmail(email);
    return result;
  };

  const createSessionFromUrl = async (url) => {
    const parsed = Linking.parse(url);
    const code = parsed.queryParams?.code;
    if (!code) return;
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  };

  const signInWithOAuth = async (provider) => {
    const redirectTo = 'dipp://auth/callback';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) return;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      await createSessionFromUrl(result.url);
    }
  };

  const signInWithGoogle = () => signInWithOAuth('google');
  const signInWithApple = () => signInWithOAuth('apple');

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, signInWithGoogle, signInWithApple }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
