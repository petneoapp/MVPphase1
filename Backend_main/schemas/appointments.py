from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Optional, List


class AppointmentCreate(BaseModel):
    vet_id: int
    appointment_date: date
    start_time: time
    end_time: time
    visit_type: str
    service_id: int
    pet_id: int
    address_id: Optional[int] = None
    reason: Optional[str] = None
    is_emergency: bool = False


class AppointmentResponse(BaseModel):
    id: int
    vet_id: int
    appointment_date: date
    start_time: time
    end_time: time
    visit_type: str
    status: str
    is_emergency: bool = False
    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    success: bool
    message: str
    data: Optional[List[AppointmentResponse]] = None


class AppointmentOut(BaseModel):
    id: int
    vet_id: int
    vet_name: str
    pet_id: int
    pet_name: str
    appointment_date: datetime
    status: str


class RescheduleRequest(BaseModel):
    new_date: date
    new_start_time: time
    new_end_time: time
    visit_type: str  # Required for validation

