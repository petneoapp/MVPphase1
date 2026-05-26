from datetime import timedelta, datetime
from models.user_models import User, UserMobileOTP, Pet
from schemas.userSchemas.user_otp_schemas import UserMobileOTPRequest, VerifyUserMobileOTP
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from utils.token import create_access_token
from models.user_models import UserSession
from models.device_token import DeviceToken
from utils.response import standard_response

router = APIRouter(tags=["Mobile OTP for User Registration"])


# === Send Mobile OTP ===
@router.post("/sendMobileOtp")
def send_otp(request: UserMobileOTPRequest, db: Session = Depends(get_db)):
    # Check if mobile number already exists and mobile is verified.
    user_exists = (
        db.query(User)
        .filter(User.phone_number == request.mobile_number, User.is_deleted == False)
        .first()
    )

    if user_exists:
        return standard_response(success=False, message="Mobile number already registered with an active account.", status_code=400)

    otp = "123456"  # Replace with actual OTP generator in production

    existing = db.query(UserMobileOTP).filter_by(mobile_number=request.mobile_number).first()

    if existing:
        existing.otp = otp
        existing.is_verified = False
        existing.created_at = datetime.utcnow()
    else:
        new_otp = UserMobileOTP(mobile_number=request.mobile_number, otp=otp)
        db.add(new_otp)

    db.commit()
    return standard_response(success=True, message="OTP sent successfully (123456 for testing).")


@router.post("/verifyMobileOtp")
def verify_otp(request: VerifyUserMobileOTP, db: Session = Depends(get_db)):
    record = db.query(UserMobileOTP).filter_by(mobile_number=request.mobile_number).first()

    if not record or record.otp != request.otp:
        return standard_response(success=False, message="Invalid OTP.")

    # Check if expired
    expiry_time = record.created_at + timedelta(minutes=10)
    if datetime.utcnow() > expiry_time:
        db.delete(record)
        db.commit()
        return standard_response(success=False, message="OTP expired.")

    # Mark as verified
    record.is_verified = True
    db.commit()

    # Check if user is soft-deleted
    deleted_user = db.query(User).filter(
        User.phone_number == request.mobile_number,
        User.is_deleted == True
    ).first()

    if deleted_user:
        data = {
            "requires_recovery": True,
            "user_id": deleted_user.id
        }
        return standard_response(success=True, message="This account was previously deleted. Do you want to recover it?", data=data)

    data = {
        "requires_recovery": False
    }
    return standard_response(success=True, message="Mobile number verified successfully.", data=data)


@router.post("/recoverAccount")
def recover_account(
    user_id: int,
    want_recover: bool,
    device_token: str = None,
    db: Session = Depends(get_db)
):
    """
    Recover a soft-deleted user account and their pets.
    Logs the user in automatically and returns access token.
    """
    user = db.query(User).filter(User.id == user_id, User.is_deleted == True).first()
    if not user:
        return standard_response(success=False, message="Deleted account not found", status_code=404)

    if not want_recover:
        return standard_response(success=False, message="Account not recovered. You can register as a new user.")

    # Recover user and pets
    user.is_deleted = False
    db.query(Pet).filter(Pet.user_id == user.id, Pet.is_deleted == True).update({"is_deleted": False})
    db.commit()

    # Remove old sessions
    db.query(UserSession).filter(UserSession.user_id == user.id).delete()

    # Create new JWT token
    token = create_access_token({"user_id": user.id})
    db.add(UserSession(user_id=user.id, token=token))

    # Save/update device token
    if device_token:
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

    db.commit()

    data = {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id
    }
    return standard_response(success=True, message="Account recovered and logged in successfully.", data=data)
