import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Verify the cached session is still valid on Supabase (not revoked/expired)
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        await supabase.auth.signOut({ scope: "local" });
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setUser(data.user.email ?? null);
        setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?.email ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password });

  const signOut = () => supabase.auth.signOut();

  return { user, loading, signIn, signUp, signOut, isAuthenticated: !!user };
}
