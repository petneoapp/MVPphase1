from datetime import  time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from database import get_db
from utils.response import standard_response
from models.vet import Vet, VetService
from models.otp_models import MobileOTP, EmailOTP
from models.session import Session as VetSession
from utils.hash import hash_password
from utils.token import create_access_token
from models.vet_availability import VetAvailability
from upload_file import upload_file_local


router = APIRouter(tags=["Vet Registration"])


# ----------------------------
# REGISTER VET
# ----------------------------
@router.post("/registerVet")
async def register_vet(
    mobile_number: str = Form(None),
    email: str = Form(None),
    password: str = Form(None),
    first_name: str = Form(None),
    last_name: str = Form(None),
    qualification: str = Form(None),
    specialization: str = Form(None),
    license_number: str = Form(None),
    license_issuing_authority: str = Form(None),
    years_of_experience: int = Form(None),
    address: str = Form(None),
    landmark: str = Form(None),
    clinic_name: str = Form(None),
    location: str = Form(None),
    service_ids: str = Form(...),
    profile_picture: UploadFile = File(None),
    clinic_latitude: float = Form(),
    clinic_longitude: float = Form(),
    certification_document: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        # 1. Check mobile verification
        mobile_entry = db.query(MobileOTP).filter_by(mobile_number=mobile_number, is_verified=True).first()
        if not mobile_entry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number is not verified."
            )
        print("Lat and lobg :",clinic_latitude, clinic_longitude )
        # 2. Check email verification
        email_entry = db.query(EmailOTP).filter_by(email=email, is_verified=True).first()
        if not email_entry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is not verified."
            )

        # 3. Already registered?
        existing_vet = db.query(Vet).filter((Vet.mobile_number == mobile_number) | (Vet.email == email)).first()
        if existing_vet:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Vet already registered."
            )

        # 4. Upload files (LOCAL STORAGE ONLY)
        profile_url = await upload_file_local(profile_picture, "vet_profile", mobile_number) if profile_picture else None
        cert_url = await upload_file_local(certification_document, "vet_cert", mobile_number) if certification_document else None

        # 5. Create vet
        new_vet = Vet(
            mobile_number=mobile_number,
            is_mobile_verified=True,
            email=email,
            email_verified=True,
            first_name=first_name,
            last_name=last_name,
            password=hash_password(password),
            qualification=qualification,
            specialization=specialization,
            license_number=license_number,
            license_issuing_authority=license_issuing_authority,
            years_of_experience=years_of_experience,
            address=address,
            landmark=landmark,
            clinic_name=clinic_name,
            location=location,
            clinic_latitude=clinic_latitude,
            clinic_longitude=clinic_longitude,
            profile_picture_url=profile_url,
            certification_document_url=cert_url
        )
        db.add(new_vet)
        db.flush()

        # 6. Add services
        for service_id in service_ids.split(","):
            if service_id.strip():
                db.add(VetService(vet_id=new_vet.id, service_id=int(service_id.strip())))

        # 7. Add default availability
        default_visit_types = ['in-clinic', 'home-visit', 'online']
        for day in range(7):
            if day < 5:  # Monday–Friday
                availability = VetAvailability(
                    vet_id=new_vet.id,
                    day_of_week=day,
                    start_time=time(9, 0, 0),
                    end_time=time(17, 0, 0),
                    slot_duration=30,
                    visit_types=default_visit_types,
                    is_closed=False
                )
            else:  # Saturday–Sunday closed
                availability = VetAvailability(
                    vet_id=new_vet.id,
                    day_of_week=day,
                    start_time=None,
                    end_time=None,
                    slot_duration=30,
                    visit_types=[],
                    is_closed=True
                )
            db.add(availability)

        # 8. Clean up OTPs
        db.delete(mobile_entry)
        db.delete(email_entry)

        # 9. Remove old sessions
        db.query(VetSession).filter_by(vet_id=new_vet.id).delete()

        # 10. Create session/token
        token = create_access_token({"vet_id": new_vet.id})
        db.add(VetSession(vet_id=new_vet.id, token=token))

        db.commit()
        db.refresh(new_vet)

        return standard_response(
            success=True,
            message="Vet registered successfully",
            data={
                "access_token": token,
                "token_type": "bearer",
                "vet_id": new_vet.id
            }
        )

    except HTTPException as he:
        db.rollback()
        return standard_response(success=False, message=he.detail, status_code=he.status_code)
    except Exception as e:
        db.rollback()
        return standard_response(success=False, message=f"Vet registration failed: {str(e)}", status_code=500)
