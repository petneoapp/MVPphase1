# models.py
from sqlalchemy import Column, Integer, String, Date, DECIMAL, ForeignKey, TIMESTAMP, Float, Text, Boolean, DateTime
from database import Base
from datetime import datetime
from sqlalchemy.orm import relationship


# =========================
# User Model
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    profile_picture_url = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


# ===========================
# Addresses of user
# ============================
class UserAddress(Base):
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # From frontend
    address = Column(String, nullable=False)
    address_details = Column(String, nullable=True)
    contact_name = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_default = Column(Boolean, default=False)

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
    breed_id = Column(Integer, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    weight = Column(DECIMAL(5,2), nullable=True)
    licence = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

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


# =========================
# UserSession Model
# =========================
class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    token = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


# =========================
# UserMobileOTP Model
# =========================
class UserMobileOTP(Base):
    __tablename__ = "user_mobile_otps"

    mobile_number = Column(String(15), primary_key=True)
    otp = Column(String(6), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)  # Add this line


class Species(Base):
    __tablename__ = "species"
    name = Column(String, primary_key=True, index=True)  # Name as primary key
    breeds = relationship("Breed", back_populates="species", cascade="all, delete-orphan")


class Breed(Base):
    __tablename__ = "breeds"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species_name = Column(String, ForeignKey("species.name", ondelete="CASCADE"))
    species = relationship("Species", back_populates="breeds")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vet_id = Column(Integer, ForeignKey("vets.id", ondelete="CASCADE"), nullable=False)

    rating = Column(Integer, nullable=False)  # 1–5 rating scale
    comment = Column(Text, nullable=True)  # user’s text comment

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # relationships
    user = relationship("User", backref="reviews")
    vet = relationship("Vet", backref="reviews")