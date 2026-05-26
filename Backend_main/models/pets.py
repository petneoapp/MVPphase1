# models.py
from sqlalchemy import Column, Integer, String, Date, DECIMAL, ForeignKey, TIMESTAMP, Text
from database import Base
from datetime import datetime


# =========================
# User Model
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    password = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


# =========================
# Pet Model
# =========================
class Pet(Base):
    __tablename__ = 'pets'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    name = Column(String, nullable=False)
    species = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    breeding = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    weight = Column(DECIMAL(5,2), nullable=True)
    licence = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


# =========================
# Vaccination Model
# =========================
class Vaccination(Base):
    __tablename__ = "vaccinations"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id", ondelete="CASCADE"))
    vaccination_name = Column(String, nullable=False)
    date_vaccinated = Column(Date, nullable=True)
    dose_type = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


# =========================
# Prescription Model
# =========================
class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    prescription_text = Column(Text, nullable=True)        # optional text notes
    file_url = Column(String, nullable=True)  # Azure URL if uploaded
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
