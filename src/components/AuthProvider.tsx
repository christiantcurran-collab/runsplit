"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const profileFetchRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    if (profileFetchRef.current === userId) return;
    profileFetchRef.current = userId;

    try {
      const { data, error } = await supabaseRef.current
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Profile fetch error:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Profile fetch exception:", err);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileFetchRef.current = null;
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseRef.current;

    // ---------------------------------------------------------------
    // PRIMARY: getSession() — reads from cookies, no server call
    // unless token refresh is needed. This is the reliable way to
    // get the initial auth state.
    // ---------------------------------------------------------------
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted || initializedRef.current) return;
        initializedRef.current = true;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
      } catch (err) {
        console.error("getSession error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // ---------------------------------------------------------------
    // SECONDARY: onAuthStateChange — handles sign-in, sign-out,
    // token refresh, and other auth events AFTER the initial load.
    // ---------------------------------------------------------------
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // If INITIAL_SESSION fires before getSession completes, use it
      if (event === "INITIAL_SESSION") {
        if (!initializedRef.current) {
          initializedRef.current = true;
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser.id);
          }
          setLoading(false);
        }
        return;
      }

      // Handle subsequent auth events
      const currentUser = session?.user ?? null;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        profileFetchRef.current = null;
        return;
      }

      // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, etc.
      setUser(currentUser);
      if (currentUser) {
        profileFetchRef.current = null; // Force re-fetch on auth change
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        profileFetchRef.current = null;
      }
    });

    // Safety timeout — if neither getSession nor onAuthStateChange
    // resolves within 6 seconds, stop the spinner
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth: safety timeout reached, stopping spinner");
        setLoading(false);
      }
    }, 6000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut();
    setUser(null);
    setProfile(null);
    profileFetchRef.current = null;
    initializedRef.current = false;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
