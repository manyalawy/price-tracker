import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const AuthContext = createContext({});

function isRecoveryUrl(url) {
  if (!url) return false;
  const parsed = Linking.parse(url);
  return !!parsed.queryParams?.code || url.includes('#access_token=');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Check for a recovery deep link before setting loading=false so the auth
      // guard doesn't redirect to login while the token exchange is in flight.
      const [initialUrl, { data: { session: initialSession } }] = await Promise.all([
        Linking.getInitialURL(),
        supabase.auth.getSession(),
      ]);

      if (isRecoveryUrl(initialUrl)) {
        setIsPasswordRecovery(true);
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
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
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('update-password'),
    });
    return result;
  };

  const updatePassword = async (newPassword) => {
    const result = await supabase.auth.updateUser({ password: newPassword });
    return result;
  };

  const deleteAccount = async () => {
    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;
    await supabase.auth.signOut();
  };

  const createSessionFromUrl = useCallback(async (url) => {
    const parsed = Linking.parse(url);
    const code = parsed.queryParams?.code;
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return;
    }

    const hash = url.split('#')[1];
    if (hash) {
      const params = Object.fromEntries(hash.split('&').map(p => p.split('=')));
      const { access_token, refresh_token } = params;
      if (access_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) throw error;
        return;
      }
    }

    throw new Error('Unable to complete sign-in. Please try again.');
  }, []);

  // Handles a foreground deep link: guards against non-recovery URLs, sets state,
  // and exchanges the token. Called from _layout.js via Linking.addEventListener.
  const handleDeepLink = useCallback(async (url) => {
    if (!isRecoveryUrl(url)) return;
    setIsPasswordRecovery(true);
    try {
      await createSessionFromUrl(url);
    } catch {
      setIsPasswordRecovery(false);
    }
  }, [createSessionFromUrl]);

  const clearPasswordRecovery = useCallback(() => setIsPasswordRecovery(false), []);

  const signInWithOAuth = async (provider) => {
    const redirectTo = 'dipp://auth/callback';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('OAuth sign-in is not available. Please try again later.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      try {
        await createSessionFromUrl(result.url);
      } catch {
        throw new Error('Failed to complete sign-in. Please try again.');
      }
    }
  };

  const signInWithGoogle = () => signInWithOAuth('google');

  return (
    <AuthContext.Provider value={{ user, session, loading, isPasswordRecovery, clearPasswordRecovery, handleDeepLink, signUp, signIn, signOut, resetPassword, updatePassword, deleteAccount, signInWithGoogle }}>
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
