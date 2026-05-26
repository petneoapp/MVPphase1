# models/device_token.py
from sqlalchemy import Column, Integer, String, DateTime, func
from database import Base

class DeviceToken(Base):
    __tablename__ = "device_tokens"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, nullable=False)   # user id or vet id
    owner_type = Column(String, nullable=False)  # 'user' or 'vet'
    fcm_token = Column(String, nullable=False)
    device_type = Column(String, nullable=True)  # 'android' | 'ios' | 'web'
    created_at = Column(DateTime, server_default=func.now())
