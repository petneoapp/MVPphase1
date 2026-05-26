# ERROR HANDLING REPORT — Resilience and Safety Systems

This report describes the multi-tier error boundary system and token exception architecture built during Phase 3.

## 1. Multi-Tier React Error Boundaries

A single Javascript crash in a non-essential sidebar element should never lead to a full-screen application failure. We implemented a two-level defense system:

```
+-------------------------------------------------------------+
|                     Root HTML Layout                        |
|  +-------------------------------------------------------+  |
|  |                 Global Error Boundary                 |  |
|  |     +-------------------------------------------+     |  |
|  |     |               Auth Provider               |     |  |
|  |     |  +-------------------------------------+  |     |  |
|  |     |  |         Dashboard Component         |  |     |  |
|  |     |  |  +--------------------------------+ |  |     |  |
|  |     |  |  | DashboardErrorBoundary (Pets)  | |  |     |  |
|  |     |  |  +--------------------------------+ |  |     |  |
|  |     |  |  +--------------------------------+ |  |     |  |
|  |     |  |  | DashboardErrorBoundary (Appts) | |  |     |  |
|  |     |  |  +--------------------------------+ |  |     |  |
|  |     |  +-------------------------------------+  |     |  |
|  |     +-------------------------------------------+     |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

### A. Level 1: Localized Boundaries (`DashboardErrorBoundary`)
- Prevents failures in client-side data parsing, empty lists, or date rendering from breaking the dashboard.
- Wrapped around `"My Pets"`, `"Quick Services"`, and `"My Appointments"` widgets on both Customer and Partner dashboards.
- Displays a specialized "Component Unavailable" warning inside the block with a Retry handler, while the parent page is kept completely interactive.

### B. Level 2: Global Fallback (`ErrorBoundary`)
- Catch-all fallback implemented in [`ErrorBoundary.tsx`](file:///d:/dev/petneoapp/backend/backend/frontend/src/components/common/ErrorBoundary.tsx) to prevent white screens of death on deep core route failures.
- Rendered safely by the [`GlobalErrorProvider.tsx`](file:///d:/dev/petneoapp/backend/backend/frontend/src/components/common/GlobalErrorProvider.tsx) wrapper which encapsulates Next.js page contexts.

---

## 2. Global Token & Session Lifecycle (Graceful Re-Authentication)

We separated token storage detection from local hook cycles and moved them into React Context:

*   **[`AuthContext.tsx`](file:///d:/dev/petneoapp/backend/backend/frontend/src/context/AuthContext.tsx)**:
    - Provides a unified context of user authentication state.
    - Eliminates synchronization issues where the header thinks a user is logged in, but API methods receive unauthorized status codes.

*   **Unified API Interceptor & Callback**:
    - [`api.ts`](file:///d:/dev/petneoapp/backend/backend/frontend/src/utils/api.ts) exposes a listener hook `onUnauthorized()`.
    - When any backend requests return a `401` or `403` status, the api interceptor immediately runs this callback.
    - `AuthContext` receives the trigger, deletes bad tokens from `localStorage`/`sessionStorage` and cookies, updates auth status across the DOM, and pushes the router back to `/login`.
    - A path check prevents any infinite redirect loops if the user is already on the login path.
