import os
from dotenv import load_dotenv
from database import SessionLocal
from models.appointments import Appointment
from models.user_models import User, Pet, Prescription
from models.vet import Vet

# Load environment variables
load_dotenv()

def fix_urls():
    db = SessionLocal()
    # Align to the active ngrok tunnel URL
    new_domain = os.getenv("BASE_URL", "https://unbiased-dane-new.ngrok-free.app").rstrip("/")
    
    # We want to replace any localhost or 127.0.0.1 urls with the public ngrok domain
    old_domains = ["http://localhost:8000", "http://127.0.0.1:8000"]

    try:
        print(f"[INFO] Starting URL rewrite to {new_domain} in database...")
        
        # 1. Update Users
        users = db.query(User).all()
        user_count = 0
        for u in users:
            if u.profile_picture_url:
                for old in old_domains:
                    if old in u.profile_picture_url:
                        u.profile_picture_url = u.profile_picture_url.replace(old, new_domain)
                        user_count += 1
        
        # 2. Update Vets
        vets = db.query(Vet).all()
        vet_count = 0
        for v in vets:
            if v.profile_picture_url:
                for old in old_domains:
                    if old in v.profile_picture_url:
                        v.profile_picture_url = v.profile_picture_url.replace(old, new_domain)
                        vet_count += 1
            if v.certification_document_url:
                for old in old_domains:
                    if old in v.certification_document_url:
                        v.certification_document_url = v.certification_document_url.replace(old, new_domain)
                        vet_count += 1

        # 3. Update Pets
        pets = db.query(Pet).all()
        pet_count = 0
        for p in pets:
            if p.profile_picture:
                for old in old_domains:
                    if old in p.profile_picture:
                        p.profile_picture = p.profile_picture.replace(old, new_domain)
                        pet_count += 1

        # 4. Update Prescriptions
        prescriptions = db.query(Prescription).all()
        presc_count = 0
        for pr in prescriptions:
            if pr.file_url:
                for old in old_domains:
                    if old in pr.file_url:
                        pr.file_url = pr.file_url.replace(old, new_domain)
                        presc_count += 1

        db.commit()
        print(f"[SUCCESS] Updated {user_count} User records.")
        print(f"[SUCCESS] Updated {vet_count} Vet records.")
        print(f"[SUCCESS] Updated {pet_count} Pet records.")
        print(f"[SUCCESS] Updated {presc_count} Prescription records.")
        print(f"[INFO] All database image URLs are successfully aligned to {new_domain}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update database URLs: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_urls()
