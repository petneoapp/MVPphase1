# API Stability Report - PetNeo Frontend

## 1. API Utility Status
The `src/utils/api.ts` utility has been upgraded to a production-ready wrapper around `fetch`.

### Features:
- **Environment Aware**: Uses `NEXT_PUBLIC_API_BASE`.
- **Auto-Unwrapping**: Automatically detects `{ success, data }` wrappers and returns only `data`.
- **Error Handling**: Throws descriptive errors based on `message` or `detail` fields from the backend.
- **Session Management**: Automatically clears local auth state on `403 Forbidden` responses.
- **Multipart Support**: Integrated `formDatapost` and `formDataPut` into the main utility.

## 2. Standardized Response Format
The frontend now expects the following format for all new API endpoints:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

## 3. Legacy Support
For backward compatibility, the `api` utility checks for the presence of the `success` key. If absent, it treats the response as a legacy format and returns the body as-is. This ensures that non-refactored pages do not break.

## 4. Unstable Areas
- **Direct Fetch Usage**: Files that still use `fetch()` directly instead of the `api` utility are at risk of breaking if the backend changes its response structure globally.
- **Hardcoded Endpoints**: Some components still have hardcoded strings for endpoints instead of using a centralized endpoint constant file.
- **Response Type Safety**: Many components cast API responses to `any`, which may hide runtime type errors.

## 5. Next Steps
- Implement a centralized `endpoints.ts` file.
- Add TypeScript interfaces for all major API responses.
- Migrate the `CustomerDashboard` data fetching to use the new `api` utility.
