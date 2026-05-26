from sqlalchemy import Table, Column, Integer, ForeignKey, String, Boolean, TIMESTAMP, DECIMAL
from datetime import datetime
from database import Base

class Vet(Base):
    __tablename__ = "vets"

    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String, unique=True, nullable=False)
    is_mobile_verified = Column(Boolean, default=False)

    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True)
    email_verified = Column(Boolean, default=False)
    password = Column(String)

    profile_picture_url = Column(String)

    qualification = Column(String)
    specialization = Column(String)
    license_number = Column(String)
    license_issuing_authority = Column(String)
    years_of_experience = Column(Integer)

    address = Column(String)
    landmark = Column(String)
    clinic_name = Column(String)
    location = Column(String)

    certification_document_url = Column(String)

    is_vet_verified = Column(Boolean, default=False)
    emergency = Column(Boolean, default=False)

    clinic_latitude = Column(DECIMAL(9, 6), nullable=True)
    clinic_longitude = Column(DECIMAL(9, 6), nullable=True)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class VetService(Base):
    __tablename__ = "vet_services"

    vet_id = Column(Integer, ForeignKey("vets.id", ondelete="CASCADE"), primary_key=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), primary_key=True)