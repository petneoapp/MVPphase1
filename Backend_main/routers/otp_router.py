from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from utils.response import standard_response
from models.otp_models import MobileOTP, EmailOTP
from models.vet import Vet  # assuming models/vet_model.py defines Vet
from schemas.otp_schemas import MobileOTPRequest, VerifyMobileOTP, EmailOTPRequest, VerifyEmailOTPRequest


router = APIRouter(tags=["Mobile/Email OTP for Vet Registration"])




# === Send Mobile OTP ===
@router.post("/sendMobileOtp")
def send_otp(request: MobileOTPRequest, db: Session = Depends(get_db)):
    # Check if mobile number already exists and mobile is verified.
    vet_exists = (
        db.query(Vet)
        .filter(
            Vet.mobile_number == request.mobile_number,
            Vet.is_mobile_verified == True)
        .first()
    )

    if vet_exists:
        return standard_response(success=False, message="Mobile number already registered.")

    otp = "123456"  # Replace with actual OTP generator in production

    existing = db.query(MobileOTP).filter_by(mobile_number=request.mobile_number).first()

    if existing:
        existing.otp = otp
        existing.is_verified = False
        existing.created_at = datetime.utcnow()
    else:
        new_otp = MobileOTP(mobile_number=request.mobile_number, otp=otp)
        db.add(new_otp)

    db.commit()
    return standard_response(success=True, message="OTP sent successfully (123456 for testing).")


@router.post("/verifyMobileOtp")
def verify_otp(request: VerifyMobileOTP, db: Session = Depends(get_db)):
    record = db.query(MobileOTP).filter_by(mobile_number=request.mobile_number).first()

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

    return standard_response(success=True, message="Mobile number verified successfully.")


@router.post("/sendEmailOtp")
def send_email_otp(request: EmailOTPRequest, db: Session = Depends(get_db)):
    email = request.email
    # otp = str(random.randint(100000, 999999))
    otp = "123456"

    # Check if email already registered and verified
    vet = db.query(Vet).filter(Vet.email == email, Vet.email_verified == True).first()
    if vet:
        return standard_response(success=False, message="Email already exists.")

    # Check if OTP already exists for the email
    existing = db.query(EmailOTP).filter_by(email=email).first()
    if existing:
        existing.otp = otp
        existing.created_at = datetime.utcnow()
        existing.is_verified = False
    else:
        new_otp = EmailOTP(email=email, otp=otp)
        db.add(new_otp)

    db.commit()
    return standard_response(success=True, message=f"OTP sent successfully to email {email}")


@router.post("/verifyEmailOtp")
def verify_email_otp(request: VerifyEmailOTPRequest, db: Session = Depends(get_db)):
    try:
        otp_entry = db.query(EmailOTP).filter_by(email=request.email).first()
        if not otp_entry:
            return standard_response(success=False, message="No OTP Record found in db. Resend for verification.")

        if datetime.utcnow() > otp_entry.created_at + timedelta(minutes=10):
            return standard_response(success=False, message="OTP has been expired.")

        if otp_entry.otp != request.otp:
            return standard_response(success=False, message="Invalid OTP.")

        # Mark as verified and create vet if needed
        otp_entry.is_verified = True
        db.commit()

        return standard_response(success=True, message="Email verified successfully.")

    except Exception as e:
        return standard_response(success=False, message=f"Internal server error: {str(e)}", status_code=500)


