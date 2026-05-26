from pydantic import BaseModel
from typing import Optional, List


class AddressUpdate(BaseModel):
    address: Optional[str] = None
    address_details: Optional[str] = None
    contact_name: Optional[str] = None
    contact_number: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AddressCreate(BaseModel):
    address: str
    address_details: Optional[str] = None
    contact_name: Optional[str] = None
    contact_number: Optional[str] = None
    location_name: Optional[str] = None
    latitude: float
    longitude: float


class AddressResponse(AddressCreate):
    id: int
    is_default: bool
    class Config:
        from_attributes = True

class UserWithAddresses(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    addresses: List[AddressResponse]

    class Config:
        from_attributes = True