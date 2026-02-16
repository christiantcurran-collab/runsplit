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

  const fetchProfile = useCallback(async (userId: string) => {
    // Deduplicate: skip if we already fetched for this user
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
      profileFetchRef.current = null; // Force re-fetch
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseRef.current;

    // ---------------------------------------------------------------
    // SINGLE SOURCE OF TRUTH: onAuthStateChange
    //
    // This fires immediately with INITIAL_SESSION (from cookies/localStorage),
    // and on every subsequent auth event (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
    //
    // We do NOT call supabase.auth.getUser() here — that makes a server
    // roundtrip that can fail and cause a flash-then-logout race condition.
    // The middleware already handles server-side token refresh.
    // ---------------------------------------------------------------
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        profileFetchRef.current = null;
        setLoading(false);
        return;
      }

      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        profileFetchRef.current = null;
      }

      setLoading(false);
    });

    // Safety timeout: if onAuthStateChange never fires (very rare),
    // stop the loading spinner after 5 seconds
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth: safety timeout reached, stopping spinner");
        setLoading(false);
      }
    }, 5000);

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
