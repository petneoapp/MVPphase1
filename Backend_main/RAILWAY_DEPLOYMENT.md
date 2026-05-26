# Railway Deployment Guide for `Backend_main`

This guide explains how to deploy the active production FastAPI backend (`Backend_main`) to Railway.

---

## Deployment Settings on Railway

When configuring your Railway service:

1. **Root Directory**: Set this to `Backend_main` (this is critical so Railway compiles and runs from the correct directory).
2. **Start Command**: Specify the following start command to bind to the dynamic host port and trust proxy headers:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips='*'
   ```
3. **Target Port Configuration (Dashboard)**: Go to **Settings > Networking** in your Railway dashboard, and verify that the **Target Port** is empty (to let Railway auto-detect) or set to match the port value (e.g. `8080` if that's what uvicorn runs on). If it's hardcoded to `8000` but uvicorn binds to `8080`, Railway will fail to respond.

---

## Required Environment Variables

Add the following environment variables in the **Variables** tab of your Railway service:

| Variable Name | Description | Example / Format |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL Connection URL | `postgresql://neondb_owner:npg_zc8MxCqp7VKX@ep-gentle-feather-ao7hg5ec.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `AZURE_STORAGE_CONNECTION_STRING` | Connection credentials for Azure Blob Storage | `DefaultEndpointsProtocol=https;AccountName=...` |
| `BASE_URL` | The public base domain of the backend service | `https://your-service-name.up.railway.app` |

---

## Troubleshooting

- **ModuleNotFoundError**: Ensure the root directory is set to `Backend_main`. If it isn't, python will not find modules in the path.
- **Port issues**: Make sure the start command uses `$PORT` (capitalized) so Railway can map incoming requests correctly.
- **Database Connection Error**: Verify that the Neon IP access control isn't blocking the Railway server IP addresses (Neon permits any connection by default).
