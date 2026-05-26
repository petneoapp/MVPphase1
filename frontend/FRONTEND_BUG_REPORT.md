# Frontend Bug Report - PetNeo Platform

## 1. Critical Performance Issues
- **Unnecessary Re-renders**:
    - The `CustomerDashboard` component re-renders its entire tree (Header, Sidebar, Content) every time the `pageType` changes.
    - Many components lack `React.memo` or proper dependency tracking in `useEffect`.
- **Memory Leaks**:
    - `dlogin.tsx` uses `setInterval` for OTP cooldown. If the component unmounts quickly or multiple times, intervals might persist if not cleared correctly (though there is a cleanup function, it's worth verifying).
    - Event listeners for notifications/Firebase should be audited for proper cleanup.

## 2. Navigation & Routing Issues
- **Pseudo-Routing**: The app uses React state (`pageType`) for navigation within the dashboard instead of Next.js dynamic routes.
- **Consequences**:
    - Back button doesn't work (takes you out of the dashboard entirely).
    - Page refreshes lose current view state.
    - Deep linking to specific pets or vets is impossible.

## 3. State Management Issues
- **State Prop Drilling**: Large state objects (like `user`, `userPets`) are passed down through multiple layers of components.
- **Recommendation**: Implement a lightweight state management solution (Zustand) or use React Context for authenticated user data.

## 4. Logic Flaws
- **OTP Cooldown**: The cooldown is purely client-side. Refreshing the page resets it, allowing unlimited OTP requests if not throttled by the backend.
- **Manual Breadcrumbs**: The logic in `CustomerDashboard.handlePageTypeChange` is complex and error-prone because it tries to mimic a navigation stack manually.
