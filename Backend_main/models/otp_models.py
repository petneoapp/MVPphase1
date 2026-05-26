# models/otp_models.py
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from database import Base

class MobileOTP(Base):
    __tablename__ = "mobile_otps"

    mobile_number = Column(String(15), primary_key=True)
    otp = Column(String(6), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)  # Add this line


class EmailOTP(Base):
    __tablename__ = "email_otps"
    email = Column(String, primary_key=True)
    otp = Column(String(6), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)  # Add this line
