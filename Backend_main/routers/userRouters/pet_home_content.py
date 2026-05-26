from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user_models import Species
from utils.response import standard_response

router = APIRouter(tags=["Species & Breeds"])


@router.get("/species")
def get_species_with_breeds(db: Session = Depends(get_db)):
    species_list = db.query(Species).all()
    data = []
    for sp in species_list:
        data.append({
            "Type": sp.name,
            "breeds": [{"id": b.id, "name": b.name} for b in sp.breeds]
        })
    return standard_response(success=True, message="Species and breeds fetched successfully", data=data)
