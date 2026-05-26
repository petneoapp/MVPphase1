# ----------------------------
# Appointment Model fix for slots
# ----------------------------
from sqlalchemy import Column, Integer, Date, Time, Text, ForeignKey, TIMESTAMP, String, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Appointment(Base):
    __tablename__ = 'appointments'

    id = Column(Integer, primary_key=True, index=True)
    vet_id = Column(Integer, ForeignKey('vets.id'), nullable=False)
    appointment_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    visit_type = Column(String, nullable=False)  #  valid_visit_types = ["in-clinic", "online", "home-visit"]
    pet_id = Column(Integer, nullable=True)
    status = Column(String, nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="SET NULL"))
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    address_id = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False)
    is_emergency = Column(Boolean, default=False, nullable=False)
    
    # Audit and lifecycle fields
    attended_by_vet = Column(Boolean, nullable=True)
    attended_by_user = Column(Boolean, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    no_show_reason = Column(Text, nullable=True)
    status_changed_at = Column(TIMESTAMP, nullable=True)
    no_show_tag = Column(String, nullable=True)

    @property
    def appointment_datetime(self):
        return datetime.combine(self.appointment_date, self.start_time)

    # Class-level access for queries
    @classmethod
    def datetime_column(cls):
        from sqlalchemy import func, cast, TIMESTAMP
        return cast(func.concat(cls.appointment_date, ' ', cls.start_time), TIMESTAMP)
