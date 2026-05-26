# PetNeo Backend Infrastructure & Migration Guide

This document clarifies the dual-backend directory layout in the repository to prevent deployment confusion and guide the team through the migration from FastAPI to NestJS.

---

## Repository Overview

```
backend/
├── Backend_main/        ← CURRENT ACTIVE PRODUCTION BACKEND (FastAPI)
├── nestjs-backend/      ← FUTURE MIGRATION TARGET (NestJS + Prisma + Neon)
├── frontend/            ← NEXT.JS WEB FRONTEND
└── mobile/              ← FLUTTER MOBILE APP
```

---

## 1. Current Production Backend: `Backend_main`

*   **Framework**: FastAPI (Python)
*   **Database ORM**: SQLAlchemy (with PostgreSQL driver)
*   **Current Role**: Handles all active API routes for both the customer and vet portals.
*   **Deployment Target**: Railway
    *   **Root Directory**: `Backend_main`
    *   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
    *   **Port binding**: Binds to `$PORT` supplied dynamically by Railway.
*   **Environment Settings**:
    *   `DATABASE_URL`: Must point to the Neon PostgreSQL database string.
    *   `AZURE_STORAGE_CONNECTION_STRING`: Connection credentials for storage blobs.
    *   `BASE_URL`: Deployment server hostname.

---

## 2. Future Migration Backend: `nestjs-backend`

*   **Framework**: NestJS (TypeScript)
*   **Database ORM**: Prisma v7 (configured with `@prisma/adapter-pg` driver adapter)
*   **Database Target**: Neon PostgreSQL
*   **Current Role**: Future architecture foundation with complete schema models designed, migrated, and compiled successfully. No live traffic is routed here yet.
*   **Key Directories**:
    *   `nestjs-backend/prisma/schema.prisma`: Contains the schema models (`User`, `Pet`, `Vet`, `Appointment`, `Product`, `Order`, `GroomingBooking`, `BoardingBooking`, `Subscription`, `Notification`, `AnalyticEvent`).
    *   `nestjs-backend/src/prisma/`: Reusable `PrismaService` and global `PrismaModule` handling connection lifecycles and graceful shutdowns.
*   **Verification Commands**:
    *   Migration: `npx prisma migrate dev --name <migration_name>`
    *   Generate Client: `npx prisma generate`
    *   Build App: `npm run build`

---

## 3. Migration Roadmap & Strategy

To avoid breaking working production logic during migration:
1.  **Keep Backend_main Active**: All active API requests from the frontend and mobile apps will continue targeting `Backend_main`.
2.  **Modular Porting**: As you write new features or migrate existing endpoints, build them inside `nestjs-backend`.
3.  **Parallel Deployment**: Deploy `nestjs-backend` to a separate staging/development domain on Railway.
4.  **Traffic Shifting**: Once all routes are ported and validated, update the frontend configuration (`NEXT_PUBLIC_API_BASE`) and mobile environment variables to point to the new NestJS backend domain.
5.  **Phase Out FastAPI**: Only delete or decommission `Backend_main` after verifying the NestJS app works under full traffic.

---

## 4. Phase 10B Shadow-State Operations & Rollback Guarantees

As part of the legacy appointment system modernization, a new **operational infrastructure** (handling organizations, branches, and resources) has been deployed in a **Shadow-State Mode** alongside `Backend_main`.

### Rollback Guarantees
Because the new operational tables are populated passively via Celery background workers (draining the `migration_outbox`), they are completely decoupled from active request paths.

If the shadow synchronization exhibits high latency, errors, or divergence:
1. **Disable Celery Queues**: Simply stop the Celery workers assigned to the `migration` and `scheduling` queues.
2. **Zero Live Impact**: Pausing the synchronization has absolutely zero impact on production APIs, booking logic, or user experience. The legacy `vets` and `appointments` tables remain the sole authoritative source of truth.
3. **Automatic Recovery**: Once the workers are brought back online, they will automatically drain the accumulated `migration_outbox` backlog in a deterministic, replay-safe manner. No manual database surgery is required.
