from pydantic import BaseModel
from typing import Optional

class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed_id: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None  # Expecting "YYYY-MM-DD"
    weight: Optional[float] = None
    licence: Optional[str] = None
    profile_picture: Optional[str] = None  # URL string if applicable
