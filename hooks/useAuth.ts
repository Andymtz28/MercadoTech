"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getCurrentUser,
  login as loginService,
  logout as logoutService,
  register as registerService,
  type AuthProfile,
} from "@/services/auth.service";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

export function useAuth() {
  const supabase = useRef(createClient()).current;
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refresh = useCallback(async () => {
    const profile = await getCurrentUser(supabase);
    setUser(profile);
    return profile;
  }, [supabase]);

  useEffect(() => {
    let active = true;

    refresh().finally(() => {
      if (active) setInitializing(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [refresh, supabase]);

  const login = useCallback(
    async (input: LoginInput) => {
      await loginService(input, supabase);
      await refresh();
    },
    [supabase, refresh],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      return registerService(input, supabase);
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    await logoutService(supabase);
    setUser(null);
  }, [supabase]);

  return { user, initializing, login, register, logout, refresh };
}
