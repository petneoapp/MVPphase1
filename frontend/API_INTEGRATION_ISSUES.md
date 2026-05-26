# API Integration Issues Report - PetNeo Platform

## 1. CRITICAL: Response Format Mismatch
- **Issue**: The backend has standardized to `{"success": true, "message": "...", "data": {...}}`.
- **Impact**: Frontend components (e.g., `cVetDetails`, `CustomerDashboard`) are currently written to expect the data directly as the root of the JSON response.
- **Example**: 
    ```typescript
    // Broken code in cVetDetails.tsx
    res1?.forEach((item: any) => { ... }) 
    // res1 is now { success: true, data: [...] }, so res1.forEach is undefined.
    ```
- **Fix Required**: Update `api.ts` to unwrap the `data` property or update all components to access `.data`.

## 2. Hardcoded Values
- **Hardcoded Endpoint**: `https://unbiased-dane-new.ngrok-free.app/api/v1` is hardcoded in `src/utils/api.ts`.
- **Fix Required**: Move this to `NEXT_PUBLIC_API_BASE` in `.env.local`.

## 3. Inconsistent API Clients
- **Mixed Usage**:
    - `src/utils/api.ts` (Fetch wrapper)
    - Raw `fetch` (in `dlogin.tsx`, `dsignup.tsx`)
    - `axios` (listed in `package.json` but usage is sparse/inconsistent)
- **Fix Required**: Standardize on the `api` utility for all calls to ensure consistent header injection (auth tokens, ngrok headers).

## 4. Error Handling
- **Weak Parsing**: The current `api.ts` logic for parsing error messages from the body is fragile and handles `body.message`, `body.detail`, and raw strings differently.
- **Fix Required**: Create a robust `handleApiError` utility that maps standard backend error codes to user-friendly messages.

## 5. Duplicate Requests
- **Double Fetching**: Some components trigger multiple identical requests on mount due to `useEffect` dependency issues or React 18 Strict Mode (which is fine, but the app doesn't handle deduplication/caching).
- **Recommendation**: Implement `React Query` or `SWR` for automatic caching and revalidation.
