# Auth Flow Report - PetNeo Frontend

## 1. Login Flow (OTP Based)
- **Component**: `components/login/dlogin.tsx`
- **Mechanism**:
  1. User enters 10-digit mobile number.
  2. Frontend calls `api.post('/auth/login/sendOtp' or '/user/login/sendOtp')`.
  3. User enters 6-digit OTP.
  4. Frontend calls `api.post('/auth/login/verifyOtp' or '/user/login/verifyOtp')`.
  5. Tokens are saved to `localStorage` and a standard cookie (for middleware).
  6. User is redirected to `/partner/dashboard` or `/customer/dashboard`.

## 2. Customer Signup Flow
- **Component**: `components/customer/signup.tsx`
- **Steps**:
  - Phone Verification (OTP).
  - Email Verification (OTP).
  - Personal Information collection.
  - Final registration via `api.formDatapost('/user/registerUser')`.

## 3. Partner Signup Flow
- **Component**: `components/partner/signup.tsx`
- **Steps**:
  - Phone Verification (OTP).
  - Email Verification (OTP).
  - Professional Details collection (Qualification, License, Clinic location via Map).
  - Final registration via `api.formDatapost('/registerVet')`.

## 4. Token Management
- **Customer Token Key**: `accessToken`
- **Partner Token Key**: `partnerAccessToken`
- **Cookie Synchronization**: Every login/refresh updates `customerAuthToken` or `partnerAuthToken` cookies to ensure Next.js middleware can handle route protection.

## 5. Known Issues
- **OTP Simulation**: Removed the "dev fallback" that accepted any OTP. The app now strictly relies on the backend for OTP verification.
- **Redirect Latency**: There is a fixed 900ms-1500ms delay after successful login/signup before redirection to allow the "Success" message to be seen.
