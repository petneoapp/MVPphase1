# =============================
# schemas/availability.py
# =============================
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import time, date

# ---- Create/Response Schemas ----
class AvailabilityCreate(BaseModel):
    day_of_week: int
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    slot_duration: Optional[int] = None
    visit_types: Optional[List[str]] = None
    is_closed: bool = False

class AvailabilityResponse(AvailabilityCreate):
    id: int
    vet_id: int

    class Config:
        from_attributes = True

class BreakCreate(BaseModel):
    availability_id: int
    start_time: time
    end_time: time

class BreakResponse(BreakCreate):
    id: int

    class Config:
        from_attributes = True

class DayOverrideCreate(BaseModel):
    date: date
    is_closed: bool = False
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    slot_duration: Optional[int] = None
    visit_types: Optional[List[str]] = None


class DayOverrideResponse(DayOverrideCreate):
    id: int
    vet_id: int

    class Config:
        from_attributes = True

# Slot response for UI
class Slot(BaseModel):
    date: date
    start_time: time
    end_time: time
    status: str  # 'available' | 'booked'
    allowed_visit_types: List[str]