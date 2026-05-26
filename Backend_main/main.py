from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from database import Base, engine

# Vet Routers
from routers import (
    vet_registration, 
    home_content, 
    service, 
    otp_router, 
    vet, 
    send_notifications,
    authentication,
    vet_availability,
    appointments
)

# User Routers
from routers.userRouters.userDeatils import (
    user_address, 
    user_appointments, 
    user_otp_router, 
    userRegistration, 
    user_authentication, 
    user_home_content, 
    user
)
from routers.userRouters import pet_home_content
from routers.userRouters.PetInfo import pet_router
from routers.userRouters.Vets import near_by_vets

app = FastAPI(title="PetNeo Backend")

# Standard CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://backend-xi-kohl-77.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.ngrok-free\.app|http://localhost:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diagnostic middleware removed — it was buffering the request body and causing hangs on Python 3.14

# Create tables
Base.metadata.create_all(bind=engine)

# Static files for uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- Include Vet Routers ---
app.include_router(vet_registration.router, prefix="/api/v1")
app.include_router(home_content.router, prefix="/api/v1")
app.include_router(service.router, prefix="/api/v1")
app.include_router(otp_router.router, prefix="/api/v1")
app.include_router(vet.router, prefix="/api/v1")
app.include_router(send_notifications.router, prefix="/api/v1")
app.include_router(authentication.router, prefix="/api/v1")
app.include_router(vet_availability.availability_router, prefix="/api/v1")
app.include_router(appointments.router, prefix="/api/v1")

# --- Include User Routers ---
app.include_router(user_otp_router.router, prefix="/api/v1/user")
app.include_router(userRegistration.router, prefix="/api/v1/user")
app.include_router(user_authentication.router, prefix="/api/v1/user")
app.include_router(user_home_content.router, prefix="/api/v1/user")
app.include_router(user_address.router, prefix="/api/v1/user")
app.include_router(user_appointments.router, prefix="/api/v1/user")
app.include_router(user.router, prefix="/api/v1/user")

app.include_router(pet_home_content.router, prefix="/api/v1/user")
app.include_router(pet_router.router, prefix="/api/v1")
app.include_router(near_by_vets.router, prefix="/api/v1/user")

@app.get("/")
def root_health():
    return {"status": "healthy"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/v1/health")
def api_v1_health():
    return {"status": "healthy"}
