from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.service import Service, Qualification
from schemas.service import ServiceCreate, ServiceOut, QualificationResponse
from utils.response import standard_response

router = APIRouter(prefix="/services", tags=["Services"])


@router.post("")
def create_service(service: ServiceCreate, db: Session = Depends(get_db)):
    existing = db.query(Service).filter(Service.name == service.name).first()
    if existing:
        return standard_response(success=False, message="Service already exists", status_code=400)
    new_service = Service(name=service.name)
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return standard_response(success=True, message="Service created successfully", data=ServiceOut.model_validate(new_service).model_dump())


@router.get("")
def get_services(db: Session = Depends(get_db)):
    data = db.query(Service).all()
    return standard_response(success=True, message="Services fetched successfully", data=[ServiceOut.model_validate(item).model_dump() for item in data])


# Get all qualifications
@router.get("/qualifications")
def get_qualifications(db: Session = Depends(get_db)):
    data = db.query(Qualification).all()
    return standard_response(success=True, message="Qualifications fetched successfully", data=[QualificationResponse.model_validate(item).model_dump() for item in data])


# Optional: Add new qualification
@router.post("/qualifications")
def add_qualification(name: str, db: Session = Depends(get_db)):
    existing = db.query(Qualification).filter_by(name=name).first()
    if existing:
        return standard_response(success=False, message="Qualification already exists", status_code=400)
    qualification = Qualification(name=name)
    db.add(qualification)
    db.commit()
    db.refresh(qualification)
    return standard_response(success=True, message="Qualification added successfully", data=QualificationResponse.model_validate(qualification).model_dump())