import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.user_models import User
from models.user_models import UserMobileOTP
from models.user_models import UserSession
from utils.hash import hash_password
from utils.token import create_access_token
from upload_file import upload_file_local
from utils.response import standard_response

router = APIRouter(tags=["User Registration"])


@router.post("/registerUser")
async def register_user(
    mobile_number: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    profile_picture: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        # Debug logging
        print(f"[DEBUG] register_user called with: mobile_number='{mobile_number}', email='{email}', first_name='{first_name}', last_name='{last_name}', password_len={len(password)}, password='{password[:10]}...'")
        
        # 1. Check mobile verification
        mobile_entry = db.query(UserMobileOTP).filter_by(mobile_number=mobile_number, is_verified=True).first()
        if not mobile_entry:
            return standard_response(success=False, message="Mobile number is not verified")

        # 2. Already registered?
        existing_user = db.query(User).filter((User.phone_number == mobile_number) | (User.email == email)).first()
        if existing_user:
            return standard_response(success=False, message="User already registered.")

        # 4. Upload profile picture if available
        profile_picture_url = None
        if profile_picture:
            profile_picture_url = await upload_file_local(profile_picture, "user_image", mobile_number)

        # 5. Create user
        new_user = User(
            phone_number=mobile_number,
            is_deleted=False,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=hash_password(password),
            profile_picture_url=profile_picture_url,
            created_at=datetime.utcnow()
        )
        db.add(new_user)
        db.flush()  # get new_user.id

        # 6. Clean up OTPs
        db.delete(mobile_entry)

        # 7. Remove old sessions
        db.query(UserSession).filter_by(user_id=new_user.id).delete()

        # 8. Generate token + session
        token = create_access_token({"user_id": new_user.id})
        db.add(UserSession(user_id=new_user.id, token=token))

        db.commit()
        db.refresh(new_user)

        data = {
            "access_token": token,
            "token_type": "bearer",
            "user_id": new_user.id
        }
        return standard_response(success=True, message="User registered successfully", data=data)

    except Exception as e:
        db.rollback()
        return standard_response(success=False, message=f"User registration failed: {str(e)}", status_code=500)