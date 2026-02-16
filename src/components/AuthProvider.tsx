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
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseRef.current
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (error) {
        console.warn("Profile fetch error:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Profile fetch exception:", err);
      if (mountedRef.current) setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = supabaseRef.current;

    // Safety timeout: ALWAYS stop loading after 5 seconds, no matter what
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current) {
        console.warn("Auth: Safety timeout reached");
        setLoading(false);
      }
    }, 5000);

    // Simple, single-path initialization
    const initialize = async () => {
      try {
        console.log("Auth: Starting initialization");
        
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Auth: getSession error:", sessionError);
        }

        if (!mountedRef.current) return;

        const currentUser = session?.user ?? null;
        console.log("Auth: Got session, user:", currentUser?.id || "none");
        
        setUser(currentUser);

        if (currentUser) {
          console.log("Auth: Fetching profile for", currentUser.id);
          // Fetch profile in background, don't block loading state
          fetchProfile(currentUser.id).catch(console.error);
        }

        // CRITICAL: Always set loading to false once we have auth state
        setLoading(false);
        console.log("Auth: Initialization complete, loading=false");
      } catch (err) {
        console.error("Auth: Initialization error:", err);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      console.log("Auth: State change event:", event);

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser.id).catch(console.error);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut();
    setUser(null);
    setProfile(null);
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
