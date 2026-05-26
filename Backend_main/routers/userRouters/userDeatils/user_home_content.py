from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user_models import User
from models.user_models import Pet
from dependencies import get_current_user
from models.notification_models import Notification
from utils.response import standard_response

router = APIRouter(tags=["User Home Screen"])


@router.get("/home")
def get_home_screen(db: Session = Depends(get_db), current_user: int = Depends(get_current_user)):
    user = db.query(User).filter(User.id == current_user).first()
    if not user:
        return standard_response(success=False, message="User not found", status_code=404)

    pets = db.query(Pet).filter(Pet.user_id == current_user, Pet.is_deleted == False).all()

    # Count unread notifications for this user
    unread_count = (
        db.query(Notification)
        .filter(
            Notification.receiver_type == "user",
            Notification.receiver_id == current_user,
            Notification.is_read == False,
        )
        .count()
    )

    data = {
        "user": {
            "id": user.id,
            "name": f"{user.first_name} {user.last_name}" if user.first_name else user.email,
            "profile_url": user.profile_picture_url
        },
        "pets": [
            {
                "id": pet.id,
                "name": pet.name,
                "profile_url": pet.profile_picture
            }
            for pet in pets
        ],
        "unread_notifications": unread_count
    }
    return standard_response(success=True, message="Home content fetched successfully", data=data)
