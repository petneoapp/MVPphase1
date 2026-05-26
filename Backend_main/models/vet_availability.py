# =============================
# models/vet_availability.py
# =============================
from sqlalchemy import Column, Integer, Time, Boolean, ForeignKey, TIMESTAMP, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import Text
from database import Base
from sqlalchemy.orm import relationship


class VetAvailability(Base):
    __tablename__ = "vet_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    vet_id = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon ... 6=Sun
    start_time = Column(Time)
    end_time = Column(Time)
    slot_duration = Column(Integer, default=30)  # minutes
    visit_types = Column(ARRAY(Text))            # ['in-clinic','video']
    is_closed = Column(Boolean, nullable=False, default=False)


class VetBreak(Base):
    __tablename__ = "vet_breaks"

    id = Column(Integer, primary_key=True, index=True)
    availability_id = Column(Integer, ForeignKey("vet_availabilities.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)


class VetDayOverride(Base):
    __tablename__ = "vet_day_overrides"

    id = Column(Integer, primary_key=True, index=True)
    vet_id = Column(Integer, nullable=False)
    date = Column(TIMESTAMP, nullable=False)  # store date; compare by .date()
    is_closed = Column(Boolean, nullable=False, default=False)
    start_time = Column(Time, nullable=True)      # optional: partial-day window
    end_time = Column(Time, nullable=True)
    slot_duration = Column(Integer, nullable=True)
    visit_types = Column(ARRAY(Text), nullable=True)  # optional override


class VetAvailabilitys(Base):
    __tablename__ = "vet_availability"

    id = Column(Integer, primary_key=True, index=True)
    vet_id = Column(Integer, ForeignKey("vets.id", ondelete="CASCADE"), nullable=False)

    day_of_week = Column(Integer, nullable=False)  # 0 = Monday, 6 = Sunday
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    slot_duration = Column(Integer, default=30)  # minutes
    break_start_time = Column(Time, nullable=True)
    break_end_time = Column(Time, nullable=True)

    visit_types = Column(String, default="In Clinic")  # comma-separated string
    is_closed = Column(Boolean, default=False)

