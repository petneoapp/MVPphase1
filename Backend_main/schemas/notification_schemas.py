from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationCreate(BaseModel):
    receiver_id: int
    receiver_type: str
    title: str
    message: str
    event_type: Optional[str] = None
    reference_id: Optional[int] = None
    redirect_to: Optional[str] = None

class NotificationResponse(BaseModel):
    id: int
    receiver_id: int
    receiver_type: str
    title: str
    message: str
    event_type: Optional[str]
    reference_id: Optional[int]
    redirect_to: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
