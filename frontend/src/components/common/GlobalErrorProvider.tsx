"use client";

import React from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";

/**
 * Client-side wrapper that applies global providers (Error Boundary, Auth Context).
 * Needed because RootLayout is a Server Component.
 */
export default function GlobalErrorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}
