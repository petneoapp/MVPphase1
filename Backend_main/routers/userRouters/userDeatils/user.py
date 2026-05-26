from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from models.user_models import User, Pet
from models.appointments import Appointment
from datetime import date
from upload_file import upload_file_bytes
from utils.response import standard_response
import asyncio
import concurrent.futures

router = APIRouter(tags=["User"])

# Thread pool for running sync body reads off the event loop
_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)


@router.get("/profile")
def get_user_profile(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """Get profile details of the logged-in user"""
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        return standard_response(success=False, message="User not found", status_code=404)

    data = {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "profile_picture_url": user.profile_picture_url,
    }
    return standard_response(success=True, message="Profile fetched successfully", data=data)


def _parse_multipart_sync(content_type: str, body: bytes):
    """
    Parse multipart/form-data synchronously using stdlib email module.
    Runs in a thread pool to avoid Python 3.14 asyncio binary read deadlock.
    """
    import email
    from email.policy import default as email_default

    raw_message = f"Content-Type: {content_type}\r\n\r\n".encode() + body
    msg = email.message_from_bytes(raw_message, policy=email_default)

    result = {
        "first_name": None,
        "last_name": None,
        "email": None,
        "image_bytes": None,
        "image_filename": "upload.jpg",
        "image_content_type": "image/jpeg",
    }

    for part in msg.walk():
        disp = part.get_content_disposition()
        if disp not in ("attachment", "form-data"):
            continue
        params = part.get_params(header="content-disposition")
        param_dict = dict(params) if params else {}
        name = param_dict.get("name", "").strip('"')
        filename = param_dict.get("filename", "").strip('"')
        payload = part.get_payload(decode=True)
        if payload is None:
            continue

        if name == "first_name":
            result["first_name"] = payload.decode("utf-8", errors="replace").strip()
        elif name == "last_name":
            result["last_name"] = payload.decode("utf-8", errors="replace").strip()
        elif name == "email":
            result["email"] = payload.decode("utf-8", errors="replace").strip()
        elif name == "profile_picture":
            result["image_bytes"] = payload
            if filename:
                result["image_filename"] = filename
            ct = part.get_content_type()
            if ct:
                result["image_content_type"] = ct

    return result


@router.put("/updateProfile")
async def update_user_profile(
    request: Request,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """
    Update profile details for the logged-in user.
    Body is read via run_in_executor to bypass Python 3.14 asyncio binary read deadlock.
    """
    import time
    start_time = time.time()
    print(f"[TRACE] STEP 1: /updateProfile called for user_id={user_id}")

    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type:
        return standard_response(success=False, message="Expected multipart/form-data", status_code=400)

    # Read body entirely in a thread so Python 3.14 asyncio deadlock is bypassed
    loop = asyncio.get_event_loop()

    async def read_body_with_timeout():
        return await asyncio.wait_for(request.body(), timeout=30.0)

    try:
        body = await read_body_with_timeout()
    except asyncio.TimeoutError:
        print(f"[ERROR] Body read timed out after 30s")
        return standard_response(success=False, message="Request body read timed out", status_code=408)

    print(f"[TRACE] STEP 2: Body read OK. Size={len(body)} bytes in {time.time()-start_time:.3f}s")

    # Parse multipart in thread pool (CPU-bound, avoids event loop blocking)
    parsed = await loop.run_in_executor(
        _thread_pool,
        _parse_multipart_sync,
        content_type,
        body
    )

    print(f"[TRACE] STEP 3: Parsed — first_name={parsed['first_name']}, email={parsed['email']}, has_image={parsed['image_bytes'] is not None}")

    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        return standard_response(success=False, message="User not found", status_code=404)

    if parsed["image_bytes"]:
        try:
            user_url = await upload_file_bytes(
                parsed["image_bytes"],
                parsed["image_filename"],
                parsed["image_content_type"],
                "user_image",
                user_id
            )
            user.profile_picture_url = user_url
            print(f"[TRACE] STEP 4: Image uploaded. URL={user_url}")
        except Exception as e:
            print(f"[ERROR] Image upload failed: {str(e)}")
            return standard_response(success=False, message=f"Image upload failed: {str(e)}", status_code=500)

    if parsed["first_name"]:
        user.first_name = parsed["first_name"]
    if parsed["last_name"]:
        user.last_name = parsed["last_name"]
    if parsed["email"]:
        existing = db.query(User).filter(User.email == parsed["email"], User.id != user_id).first()
        if existing:
            return standard_response(success=False, message="Email already in use by another user", status_code=400)
        user.email = parsed["email"]

    db.commit()
    db.refresh(user)

    print(f"[TRACE] STEP 5: Done in {time.time()-start_time:.3f}s")
    return standard_response(success=True, message="Profile updated successfully")


@router.delete("/deleteAccount")
def delete_user_account(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """Soft delete the logged-in user's account."""
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        return standard_response(success=False, message="User not found", status_code=404)

    user.is_deleted = True

    pets = db.query(Pet).filter(Pet.user_id == user_id, Pet.is_deleted == False).all()
    for pet in pets:
        pet.is_deleted = True

    pet_ids = [p.id for p in pets]
    if pet_ids:
        future_appointments = db.query(Appointment).filter(
            Appointment.pet_id.in_(pet_ids),
            Appointment.appointment_date >= date.today(),
            Appointment.status.in_(["booked", "on-going"])
        ).all()
        for appt in future_appointments:
            appt.status = "cancelled"
            appt.cancelled_reason = "User account deleted"

    db.commit()
    return standard_response(success=True, message="Account and related data soft-deleted successfully")