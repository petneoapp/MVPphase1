from pydantic import BaseModel, EmailStr
from typing import List, Optional


class VetRegistrationRequest(BaseModel):
    first_name: str
    last_name: str
    mobile_number: str
    email: EmailStr
    password: str
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    service_ids: List[int]

    profile_picture_url: Optional[str] = None
    certification_document_url: Optional[str] = None
    license_issuing_authority: Optional[str] = None
    years_of_experience: Optional[int] = None
    address: Optional[str] = None
    landmark: Optional[str] = None
    clinic_name: Optional[str] = None
    location: Optional[str] = None
