import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const loadRole = useCallback(async (userId) => {
    if (!userId) {
      setRole(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    setRole(data?.role || 'user');
  }, []);

  const applySession = useCallback(async (session) => {
    const sessionUser = session?.user || null;
    setUser(sessionUser);
    setIsAuthenticated(!!sessionUser);
    await loadRole(sessionUser?.id);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, [loadRole]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [applySession]);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    const { data } = await supabase.auth.getSession();
    await applySession(data.session);
  }, [applySession]);

  const logout = useCallback(async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setRole(null);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAuthenticated,
      isLoadingAuth,
      authChecked,
      logout,
      checkUserAuth,
    }}>
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
