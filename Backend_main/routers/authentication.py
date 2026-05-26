from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from utils.token import create_access_token
from datetime import datetime, timedelta
from models.session import Session as VetSession
from models.otp_models import MobileOTP, EmailOTP
from models.vet import Vet
import random
from models.device_token import DeviceToken
from utils.response import standard_response

router = APIRouter(prefix="/auth", tags=["Vet Authentication"])


# Helper to generate and send OTP
def generate_and_send_otp(mobile_number: str, db: Session):
    otp = str(random.randint(100000, 999999))
    otp = "123456" # For testing
    db.query(MobileOTP).filter(MobileOTP.mobile_number == mobile_number).delete()
    db.add(MobileOTP(mobile_number=mobile_number, otp=otp, created_at=datetime.utcnow()))
    db.commit()
    return otp


@router.post("/login/sendOtp")
def send_login_otp(mobile_number: str, db: Session = Depends(get_db)):
    vet = db.query(Vet).filter(Vet.mobile_number == mobile_number).first()
    if not vet:
        return standard_response(success=False, message="Mobile number not registered.")

    generate_and_send_otp(mobile_number, db)
    return standard_response(success=True, message="OTP sent to registered number")


@router.post("/login/verifyOtp")
def verify_login_otp(mobile_number: str, otp: str, device_token: str, db: Session = Depends(get_db)):
    otp_entry = db.query(MobileOTP).filter(MobileOTP.mobile_number == mobile_number).first()

    if not otp_entry or otp_entry.otp != otp:
        return standard_response(success=False, message="Invalid OTP.")

    # Optional: check expiry time
    if otp_entry.created_at < datetime.utcnow() - timedelta(minutes=10):
        return standard_response(success=False, message="OTP expired.")

    vet = db.query(Vet).filter(Vet.mobile_number == mobile_number).first()
    if not vet:
        return standard_response(success=False, message="Couldn't find the mobile number")

    # Remove old sessions
    db.query(VetSession).filter_by(vet_id=vet.id).delete()

    # Create session/token
    token = create_access_token({"vet_id": vet.id})
    db.add(VetSession(vet_id=vet.id, token=token))

    # Save or update device token
    existing_device = db.query(DeviceToken).filter(DeviceToken.fcm_token == device_token).first()
    if existing_device:
        existing_device.owner_id = vet.id
        existing_device.owner_type = "vet"
        existing_device.device_type = "mobile"
    else:
        new_device = DeviceToken(
            owner_id=vet.id,
            owner_type="vet",
            fcm_token=device_token,
            device_type="mobile"
        )
        db.add(new_device)

    # Cleanup OTP
    db.delete(otp_entry)
    db.commit()

    return standard_response(
        success=True,
        message="Login successful",
        data={
            "access_token": token,
            "token_type": "bearer",
            "vet_id": vet.id
        }
    )
