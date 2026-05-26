# Frontend Cleanup Report - PetNeo Platform

## 1. Structure Analysis
- **Current Structure**: Next.js project using the `app` router. However, most logic is contained within monolithic components in the `components` directory.
- **Issues**:
    - `components` directory is outside of `src`. While valid, it's non-standard for modern Next.js projects and can make pathing confusing.
    - `react-router-dom` is included in `package.json` but shouldn't be used in a Next.js project.
    - `src/utils/api.ts` is under-utilized; many components still use raw `fetch`.

## 2. Identified Unused/Duplicate Files
- **Unused Dependencies**: `react-router-dom` appears to be unused as the project uses Next.js `app` router.
- **Duplicate Logic**: 
    - Token management is duplicated between `src/utils/api.ts` and `components/login/dlogin.tsx`.
    - `request` and `multiPartRequest` in `api.ts` share ~90% of the same code.

## 3. General Cleanup Recommendations
- **Consolidate components**: Move the `components` folder into `src/components`.
- **Standardize Utils**: Ensure all API calls go through the `api` utility.
- **Environmentalize Config**: Move the hardcoded ngrok URL in `api.ts` to `.env.local`.
- **Remove Unused Packages**: Uninstall `react-router-dom` to reduce bundle size.

## 4. Stability Risks
- **Monolithic Dashboard**: `CustomerDashboard` manages multiple "pages" via state. If this component crashes, the entire user session is affected.
- **Global CSS**: `globals.css` contains minimal styles, but Tailwind is used extensively. Ensure consistent design tokens.
