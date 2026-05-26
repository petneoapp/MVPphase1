"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getPartnerAccessToken, clearAuth, onUnauthorized } from "@/utils/api";

export type AuthFlow = "customer" | "partner" | null;

interface AuthState {
  /** Whether the user has a valid token for the current flow */
  isAuthenticated: boolean;
  /** Detected user flow from stored tokens */
  flow: AuthFlow;
  /** Manually trigger a sign-out (clears tokens and redirects) */
  signOut: (flow?: AuthFlow) => void;
  /** Called by api.ts when a 401/403 is received to trigger re-auth */
  handleUnauthorized: (flow?: AuthFlow) => void;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  flow: null,
  signOut: () => {},
  handleUnauthorized: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [flow, setFlow] = useState<AuthFlow>(null);

  /**
   * Called by the api utility when a 401 or 403 response is received.
   * Prevents infinite redirect loops by checking current path.
   */
  const handleUnauthorized = useCallback(
    (targetFlow?: AuthFlow) => {
      const resolvedFlow = targetFlow ?? flow ?? "customer";
      // Guard: don't redirect if already on login
      if (typeof window !== "undefined" && window.location.pathname === "/login") {
        return;
      }
      clearAuth(resolvedFlow);
      setIsAuthenticated(false);
      setFlow(null);
      router.push("/login");
    },
    [flow, router]
  );

  // Register the global unauthorized callback
  useEffect(() => {
    onUnauthorized((targetFlow) => {
      handleUnauthorized(targetFlow);
    });
  }, [handleUnauthorized]);

  // On mount, detect auth state from stored tokens
  useEffect(() => {
    const customerToken = getAccessToken();
    const partnerToken = getPartnerAccessToken();

    if (customerToken) {
      setIsAuthenticated(true);
      setFlow("customer");
    } else if (partnerToken) {
      setIsAuthenticated(true);
      setFlow("partner");
    } else {
      setIsAuthenticated(false);
      setFlow(null);
    }
  }, []);

  const signOut = useCallback(
    (targetFlow?: AuthFlow) => {
      const resolvedFlow = targetFlow ?? flow ?? "customer";
      clearAuth(resolvedFlow);
      setIsAuthenticated(false);
      setFlow(null);
      router.push("/login");
    },
    [flow, router]
  );

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, flow, signOut, handleUnauthorized }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook for consuming auth state across the app */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
