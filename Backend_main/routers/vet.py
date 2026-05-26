import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models.vet import Vet, VetService
from models.service import Service
from dependencies import get_current_vet
from pydantic import BaseModel
from upload_file import upload_file_local
from utils.response import standard_response


class EmergencyUpdate(BaseModel):
    emergency: bool


router = APIRouter(
    prefix="/vet",
    tags=["Vet"],
    dependencies=[Depends(get_current_vet)]
)

# ---------------------------
# GET my bio
# ---------------------------
@router.get("/myBio")
def get_my_bio(vet_id: int = Depends(get_current_vet), db: Session = Depends(get_db)):
    vet = db.query(Vet).filter(Vet.id == vet_id).first()
    if not vet:
        return standard_response(success=False, message="Vet not found", status_code=404)

    service_records = (
        db.query(Service.name)
        .join(VetService, Service.id == VetService.service_id)
        .filter(VetService.vet_id == vet_id)
        .all()
    )
    service_names = [s.name for s in service_records]

    data = {
        "vet_id": vet.id,
        "first_name": vet.first_name,
        "last_name": vet.last_name,
        "email": vet.email,
        "mobile_number": vet.mobile_number,
        "qualification": vet.qualification,
        "specialization": vet.specialization,
        "license_number": vet.license_number,
        "license_issuing_authority": vet.license_issuing_authority,
        "years_of_experience": vet.years_of_experience,
        "address": vet.address,
        "landmark": vet.landmark,
        "clinic_name": vet.clinic_name,
        "location": vet.location,
        "clinic_latitude": float(vet.clinic_latitude) if vet.clinic_latitude else None,
        "clinic_longitude": float(vet.clinic_longitude) if vet.clinic_longitude else None,
        "profile_picture_url": vet.profile_picture_url,
        "certification_document_url": vet.certification_document_url,
        "emergency": vet.emergency or False,
        "services": service_names
    }
    return standard_response(success=True, message="Vet bio fetched successfully", data=data)


# ---------------------------
# UPDATE my bio
# ---------------------------
@router.put("/updateBio")
async def update_my_bio(
    first_name: str = Form(None),
    last_name: str = Form(None),
    qualification: str = Form(None),
    specialization: str = Form(None),
    license_number: str = Form(None),
    license_issuing_authority: str = Form(None),
    years_of_experience: int = Form(None),
    address: str = Form(None),
    landmark: str = Form(None),
    clinic_name: str = Form(None),
    location: str = Form(None),
    profile_picture: UploadFile = File(None),
    certification_document: UploadFile = File(None),
    clinic_latitude: float = Form(None),
    clinic_longitude: float = Form(None),
    service_ids: str = Form(None),
    vet_id: int = Depends(get_current_vet),
    db: Session = Depends(get_db)
):
    vet = db.query(Vet).filter(Vet.id == vet_id).first()
    if not vet:
        return standard_response(success=False, message="Vet not found", status_code=404)

    # Uploads (overwrite if Azure URL already present)
    if profile_picture:
        vet.profile_picture_url = await upload_file_local(profile_picture, "vet_profile", vet_id) if profile_picture else None

    if certification_document:
        vet.certification_document_url = await upload_file_local(certification_document, "vet_cert", vet_id) if certification_document else None


    # Update other fields
    for field, value in {
        "first_name": first_name,
        "last_name": last_name,
        "qualification": qualification,
        "specialization": specialization,
        "license_number": license_number,
        "license_issuing_authority": license_issuing_authority,
        "years_of_experience": years_of_experience,
        "address": address,
        "landmark": landmark,
        "clinic_name": clinic_name,
        "location": location,
        "clinic_latitude": clinic_latitude,
        "clinic_longitude": clinic_longitude,
    }.items():
        if value is not None:
            setattr(vet, field, value)

    # Update services
    if service_ids:
        db.query(VetService).filter(VetService.vet_id == vet_id).delete()
        for sid in service_ids.split(","):
            if sid.strip():
                db.add(VetService(vet_id=vet_id, service_id=int(sid.strip())))

    db.commit()
    db.refresh(vet)

    return standard_response(success=True, message="Vet profile updated successfully")


# ---------------------------
# UPDATE emergency availability
# ---------------------------
@router.put("/updateEmergency")
def update_emergency(
    update_in: EmergencyUpdate,
    vet_id: int = Depends(get_current_vet),
    db: Session = Depends(get_db)
):
    """
    Update emergency availability for the logged-in vet.
    Expects JSON: {"emergency": true/false}
    """
    vet = db.query(Vet).filter(Vet.id == vet_id).first()
    if not vet:
        return standard_response(success=False, message="Vet not found", status_code=404)

    vet.emergency = update_in.emergency
    db.commit()
    db.refresh(vet)

    return standard_response(
        success=True,
        message=f"Emergency status updated to {'ON' if update_in.emergency else 'OFF'} successfully"
    )
