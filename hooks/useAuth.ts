"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCurrentUser,
  login as loginService,
  logout as logoutService,
  register as registerService,
  subscribeToAuthChanges,
  type AuthProfile,
} from "@/services/auth.service";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refresh = useCallback(async () => {
    const profile = await getCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let active = true;

    refresh().finally(() => {
      if (active) setInitializing(false);
    });

    const unsubscribe = subscribeToAuthChanges(() => {
      refresh();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refresh]);

  const login = useCallback(
    async (input: LoginInput) => {
      await loginService(input);
      await refresh();
    },
    [refresh],
  );

  const register = useCallback(async (input: RegisterInput) => {
    return registerService(input);
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
  }, []);

  return { user, initializing, login, register, logout, refresh };
}
