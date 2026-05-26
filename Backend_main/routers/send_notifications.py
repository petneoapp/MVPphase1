# routers/notifications.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models.notification_models import Notification
from models.device_token import DeviceToken
from schemas.notification_schemas import NotificationCreate, NotificationResponse
from schemas.device_token import DeviceTokenIn
from utils.notifications import send_fcm_message
from database import get_db
from dependencies import get_current_user, get_current_vet
from utils.response import standard_response

router = APIRouter(tags=["Notifications"])


# ✅ Get all notifications for current vet/user
@router.get("/user/notifications")
async def get_my_user_notifications(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    rows = (
        db.query(Notification)
        .filter(
            Notification.receiver_type == "user",
            Notification.receiver_id == current_user,
        )
        .order_by(Notification.created_at.desc())
        .all()
    )
    data = [NotificationResponse.model_validate(row).model_dump() for row in rows]
    return standard_response(success=True, message="User notifications fetched successfully", data=data)


# ✅ Get all notifications for current vet/user
@router.get("/vet/notifications")
async def get_my_vet_notifications(
    db: Session = Depends(get_db),
    current_vet: int = Depends(get_current_vet)
):
    rows = (
        db.query(Notification)
        .filter(
            Notification.receiver_type == "vet",
            Notification.receiver_id == current_vet,
        )
        .order_by(Notification.created_at.desc())
        .all()
    )
    data = [NotificationResponse.model_validate(row).model_dump() for row in rows]
    return standard_response(success=True, message="Vet notifications fetched successfully", data=data)


# ✅ Mark a specific notification as read
@router.put("/notifications/{notification_id}/read")
async def mark_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        return standard_response(success=False, message="Notification not found", status_code=404)
    n.is_read = True
    db.commit()
    return standard_response(success=True, message="Marked as read")
