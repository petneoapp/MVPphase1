# models/notification_models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from datetime import datetime
from database import Base

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    receiver_id = Column(Integer, nullable=False)            # user id or vet id
    receiver_type = Column(String, nullable=False)           # 'user' or 'vet'
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    event_type = Column(String, nullable=True)               # e.g. 'appointment'
    reference_id = Column(Integer, nullable=True)            # e.g. appointment id
    redirect_to = Column(String, nullable=True)              # e.g. "/appointments/123"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
