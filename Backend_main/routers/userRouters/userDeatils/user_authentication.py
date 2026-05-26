from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from utils.token import create_access_token
from datetime import datetime, timedelta
from models.user_models import UserSession
from models.user_models import UserMobileOTP
from models.user_models import User
from models.device_token import DeviceToken
from utils.response import standard_response
import random

router = APIRouter(prefix="/login", tags=["User Authentication"])


# Helper to generate and send OTP
def generate_and_send_user_otp(mobile_number: str, db: Session):
    otp = str(random.randint(100000, 999999))
    otp = "123456" # For testing
    db.query(UserMobileOTP).filter(UserMobileOTP.mobile_number == mobile_number).delete()
    db.add(UserMobileOTP(mobile_number=mobile_number, otp=otp, created_at=datetime.utcnow()))
    db.commit()
    return otp


@router.post("/sendOtp")
def send_user_login_otp(mobile_number: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == mobile_number, User.is_deleted == False).first()
    if not user:
        return standard_response(success=False, message="Mobile number not registered.")

    generate_and_send_user_otp(mobile_number, db)
    return standard_response(success=True, message="OTP sent to registered number")


@router.post("/verifyOtp")
def verify_user_login_otp(
    mobile_number: str,
    otp: str,
    device_token: str,
    db: Session = Depends(get_db)
):
    # Fetch OTP record
    otp_entry = db.query(UserMobileOTP).filter(UserMobileOTP.mobile_number == mobile_number).first()
    if not otp_entry:
        return standard_response(success=False, message="OTP not found or expired", status_code=404)

    if otp_entry.otp != otp:
        return standard_response(success=False, message="Invalid OTP", status_code=400)

    # Check expiry (10 minutes validity)
    if otp_entry.created_at < datetime.utcnow() - timedelta(minutes=10):
        db.delete(otp_entry)
        db.commit()
        return standard_response(success=False, message="OTP expired", status_code=400)

    # Get user
    user = db.query(User).filter(User.phone_number == mobile_number).first()
    if not user:
        return standard_response(success=False, message="User not found", status_code=404)

    # Remove old sessions
    db.query(UserSession).filter_by(user_id=user.id).delete()

    # Create JWT token
    token = create_access_token({"user_id": user.id})
    db.add(UserSession(user_id=user.id, token=token))

    # Save or update device token
    existing_device = db.query(DeviceToken).filter(DeviceToken.fcm_token == device_token).first()
    if existing_device:
        existing_device.owner_id = user.id
        existing_device.owner_type = "user"
        existing_device.device_type = "mobile"
    else:
        new_device = DeviceToken(
            owner_id=user.id,
            owner_type="user",
            fcm_token=device_token,
            device_type="mobile"
        )
        db.add(new_device)

    # Cleanup OTP entry
    db.delete(otp_entry)
    db.commit()

    data = {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id
    }
    return standard_response(success=True, message="Login successful", data=data)
