# pet_router.py
from models.user_models import Pet, Vaccination, User, Prescription, Breed
from models.appointments import Appointment
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from database import get_db
from schemas.userSchemas.pet import PetUpdate
from dependencies import get_current_user, get_current_vet
from upload_file import upload_file_local
from utils.response import standard_response
import os

router = APIRouter(
    prefix="/pets",
    tags=["Pets Information"]
)

def age_conversion(dob: date):
    if not dob:
        return None
    today = date.today()
    years = today.year - dob.year
    months = today.month - dob.month
    days = today.day - dob.day

    if days < 0:
        months -= 1
    if months < 0:
        years -= 1
        months += 12

    if years > 0 and months > 0:
        return f"{years} year{'s' if years > 1 else ''} {months} month{'s' if months > 1 else ''}"
    elif years > 0:
        return f"{years} year{'s' if years > 1 else ''}"
    else:
        return f"{months} month{'s' if months > 1 else ''}"


@router.get("/myPets")
def get_user_pets(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    """
    Fetch all pets for the logged-in user.
    """
    pets = db.query(Pet).filter(Pet.user_id == user_id, Pet.is_deleted == False).all()
    if not pets:
        return standard_response(success=True, message="No pets found", data=[])

    data = [{"id": pet.id, "name": pet.name, "age": pet.date_of_birth, "pet_profile_picture": pet.profile_picture } for pet in pets]
    return standard_response(success=True, message="Pets fetched successfully", data=data)


@router.get("/{pet_id}")
def get_pet_complete_details(pet_id: int, db: Session = Depends(get_db), current_vet: int = Depends(get_current_vet)):
    """
    Fetch pet details along with user info, medical history, vaccinations, and visit history
    For Vets.
    """
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        return standard_response(success=False, message="Pet not found", status_code=404)

    user = db.query(User).filter(User.id == pet.user_id).first()
    if not user:
        return standard_response(success=False, message="User not found for this pet", status_code=404)

    breed_name = None
    if pet.breed_id:
        breed = db.query(Breed).filter(Breed.id == pet.breed_id).first()
        breed_name = breed.name if breed else None

    # Fetch vaccinations
    vaccinations = db.query(Vaccination).filter(Vaccination.pet_id == pet_id).all()
    vaccination_list = [
        {
            "id": v.id,
            "vaccination_name": v.vaccination_name,
            "date_vaccinated": v.date_vaccinated,
            "dose_type": v.dose_type
        }
        for v in vaccinations
    ]

    # Fetch visit history (appointments)
    allowed_status = ["completed", "booked", "on-going"]
    visits = (
        db.query(Appointment)
        .filter(Appointment.pet_id == pet_id, Appointment.status.in_(allowed_status), Appointment.vet_id == current_vet)
        .all()
    )

    visit_history = [
        {
            "appointment_id": appt.id,
            "date": appt.appointment_date.strftime("%Y-%m-%d"),
            "start_time": appt.start_time.strftime("%I:%M %p") if appt.start_time else None,
            "end_time": appt.end_time.strftime("%I:%M %p") if appt.end_time else None,
            "reason": appt.reason,
            "notes": appt.notes,
            "status": appt.status,
            "visit_type": appt.visit_type,
        }
        for appt in visits
    ]

    visit_history.sort(
        key=lambda v: datetime.strptime(f"{v['date']} {v['start_time']}", "%Y-%m-%d %I:%M %p")
        if v["start_time"] else datetime.strptime(v["date"], "%Y-%m-%d"),
        reverse=True
    )

    # Fetch prescriptions
    prescriptions = (
        db.query(Prescription)
        .join(Appointment, Prescription.appointment_id == Appointment.id)
        .filter(Appointment.pet_id == pet_id)
        .order_by(Prescription.created_at.desc())
        .all()
    )

    prescription_list = [
        {
            "id": p.id,
            "appointment_id": p.appointment_id,
            "text": p.prescription_text,
            "file_url": p.file_url,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for p in prescriptions
    ]

    data = {
        "visit_history": visit_history,
        "pet": {
            "id": pet.id,
            "name": pet.name,
            "species": pet.species,
            "gender": pet.gender,
            "breeding": breed_name,
            "age": pet.date_of_birth,
            "weight": float(pet.weight) if pet.weight else None,
            "licence": pet.licence,
            "profile_picture": pet.profile_picture,
        },
        "Owner": {
            "name": f"{user.first_name} {user.last_name}",
            "address": "Hyderabad",
            "contact_number": user.phone_number
        },
        "vaccinations": vaccination_list,
        "prescriptions": prescription_list
    }
    return standard_response(success=True, message="Pet details fetched successfully", data=data)


@router.post("/addPrescription")
async def add_prescription(
    appointment_id: Optional[int] = Form(None),
    pet_id: Optional[int] = Form(None),
    text: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    vet_id: int = Depends(get_current_vet)
):
    if not text and not file:
        return standard_response(success=False, message="Provide either text or file", status_code=400)

    if not appointment_id:
        if not pet_id:
            return standard_response(success=False, message="Either appointment_id or pet_id must be provided", status_code=400)
        
        # Create a Completed offline appointment so the prescription has a valid appointment_id
        today_date = date.today()
        now_time = datetime.now().time()
        
        dummy_appt = Appointment(
            pet_id=pet_id,
            vet_id=vet_id,
            appointment_date=today_date,
            start_time=now_time,
            end_time=now_time,
            visit_type="in-clinic",
            status="completed",
            reason="Prescription Consultation",
            created_at=datetime.utcnow(),
            is_emergency=False
        )
        db.add(dummy_appt)
        db.commit()
        db.refresh(dummy_appt)
        appointment_id = dummy_appt.id

    file_url = None
    if file:
        file_url = await upload_file_local(file, "pet_prescription", appointment_id)

    prescription = Prescription(
        appointment_id=appointment_id,
        prescription_text=text,
        file_url=file_url
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    return standard_response(success=True, message="Prescription added successfully", data={
        "prescription_id": prescription.id,
        "text": text
    })


@router.post("/addVaccination")
def add_vaccination_vet(
    pet_id: int = Form(...),
    vaccination_name: str = Form(...),
    date_vaccinated: str = Form(),
    dose_type: str = Form(),
    db: Session = Depends(get_db)
):
    """
    Add a vaccination record for a pet (Vet side)
    """
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        return standard_response(success=False, message="Pet not found", status_code=404)

    vaccination_date = None
    if date_vaccinated:
        try:
            vaccination_date = datetime.strptime(date_vaccinated, "%Y-%m-%d").date()
        except ValueError:
            return standard_response(success=False, message="Invalid date format. Use YYYY-MM-DD", status_code=400)

    new_vaccine = Vaccination(
        pet_id=pet_id,
        vaccination_name=vaccination_name,
        date_vaccinated=vaccination_date,
        dose_type=dose_type,
        created_at=datetime.utcnow()
    )

    db.add(new_vaccine)
    db.commit()
    db.refresh(new_vaccine)

    return standard_response(success=True, message="Vaccination added successfully")


@router.post("/user/addVaccination")
def add_vaccination_user(
    pet_id: int = Form(...),
    vaccination_name: str = Form(...),
    date_vaccinated: str = Form(),
    dose_type: str = Form(),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """
    Add a vaccination record for a pet (User side)
    """
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.is_deleted == False).first()
    if not pet:
        return standard_response(success=False, message="Pet not found", status_code=404)

    if pet.user_id != user_id:
        return standard_response(success=False, message="You are not authorized to add details for this pet", status_code=403)

    vaccination_date = None
    if date_vaccinated:
        try:
            vaccination_date = datetime.strptime(date_vaccinated, "%Y-%m-%d").date()
        except ValueError:
            return standard_response(success=False, message="Invalid date format. Use YYYY-MM-DD", status_code=400)

    new_vaccine = Vaccination(
        pet_id=pet_id,
        vaccination_name=vaccination_name,
        date_vaccinated=vaccination_date,
        dose_type=dose_type,
        created_at=datetime.utcnow()
    )

    db.add(new_vaccine)
    db.commit()
    db.refresh(new_vaccine)

    return standard_response(success=True, message="Vaccination added successfully")


@router.put("/user/updateVaccination/{vaccination_id}")
def update_vaccination(
    vaccination_id: int,
    vaccination_name: str = Form(None),
    date_vaccinated: str = Form(None),
    dose_type: str = Form(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    vaccine = db.query(Vaccination).filter(Vaccination.id == vaccination_id).first()
    if not vaccine:
        return standard_response(success=False, message="Vaccination record not found", status_code=404)

    pet = db.query(Pet).filter(Pet.id == vaccine.pet_id).first()
    if not pet or pet.user_id != user_id:
        return standard_response(success=False, message="Unauthorized to update this vaccination", status_code=403)

    if vaccination_name:
        vaccine.vaccination_name = vaccination_name
    if dose_type:
        vaccine.dose_type = dose_type
    if date_vaccinated:
        try:
            vaccine.date_vaccinated = datetime.strptime(date_vaccinated, "%Y-%m-%d").date()
        except ValueError:
            return standard_response(success=False, message="Invalid date format. Use YYYY-MM-DD", status_code=400)

    vaccine.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(vaccine)

    return standard_response(success=True, message="Vaccination updated successfully")


@router.delete("/user/deleteVaccination/{vaccination_id}")
def delete_vaccination(
    vaccination_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    vaccine = db.query(Vaccination).filter(Vaccination.id == vaccination_id).first()
    if not vaccine:
        return standard_response(success=False, message="Vaccination record not found", status_code=404)

    pet = db.query(Pet).filter(Pet.id == vaccine.pet_id).first()
    if not pet or pet.user_id != user_id:
        return standard_response(success=False, message="Unauthorized to delete this vaccination", status_code=403)

    db.delete(vaccine)
    db.commit()
    return standard_response(success=True, message="Vaccination deleted successfully")


@router.post("/addPet")
async def add_pet(
    name: str = Form(...),
    species: str = Form(...),
    breed_id: str = Form(...),
    gender: str = Form(...),
    date_of_birth: str = Form(None),
    weight: float = Form(None),
    licence: str = Form(None),
    profile_picture: UploadFile = File(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    try:
        existing_pet = db.query(Pet).filter(Pet.user_id == user_id, Pet.licence == licence).first()
        if existing_pet:
            if existing_pet.is_deleted:
                return standard_response(success=False, message=f"A pet with licence '{licence}' exists but was deleted.", data={"pet_id": existing_pet.id, "deleted": True})
            else:
                return standard_response(success=False, message=f"A pet with licence '{licence}' already exists.", status_code=400)

        profile_picture_url = None
        if profile_picture:
            profile_picture_url = await upload_file_local(profile_picture, "pet_image", user_id)

        new_pet = Pet(
            user_id=user_id,
            name=name,
            species=species,
            breed_id=breed_id,
            gender=gender,
            date_of_birth=datetime.strptime(date_of_birth, "%Y-%m-%d").date() if date_of_birth else None,
            weight=weight,
            licence=licence,
            profile_picture=profile_picture_url,
            created_at=datetime.utcnow(),
            is_deleted=False
        )
        db.add(new_pet)
        db.commit()
        db.refresh(new_pet)

        return standard_response(success=True, message="Pet added successfully", data={"pet_id": new_pet.id})

    except Exception as e:
        db.rollback()
        return standard_response(success=False, message=f"Failed to add pet: {str(e)}", status_code=500)


@router.put("/updatePet/{pet_id}")
async def update_pet(
    pet_id: int,
    name: Optional[str] = Form(None),
    species: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    breed_id: Optional[int] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    weight: Optional[float] = Form(None),
    licence: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == user_id, Pet.is_deleted == False).first()
    if not pet:
        return standard_response(success=False, message="Pet not found or not owned by user", status_code=404)

    if name is not None: pet.name = name
    if species is not None: pet.species = species
    if gender is not None: pet.gender = gender
    if breed_id is not None: pet.breed_id = breed_id
    if date_of_birth:
        try:
            pet.date_of_birth = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            return standard_response(success=False, message="Invalid date format. Use YYYY-MM-DD", status_code=400)
    if weight is not None: pet.weight = weight
    if licence is not None: pet.licence = licence
    if profile_picture:
        pet.profile_picture = await upload_file_local(profile_picture, "pet_image", user_id)

    db.commit()
    db.refresh(pet)
    return standard_response(success=True, message="Pet updated successfully", data={"pet_id": pet.id})


@router.get("/user/{pet_id}")
def get_pet_complete_details_for_user(pet_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        return standard_response(success=False, message="Pet not found", status_code=404)

    if pet.user_id != user_id:
        return standard_response(success=False, message="You are not the Owner of the pet.", status_code=401)

    breed_name = None
    if pet.breed_id:
        breed = db.query(Breed).filter(Breed.id == pet.breed_id).first()
        breed_name = breed.name if breed else None

    vaccinations = db.query(Vaccination).filter(Vaccination.pet_id == pet_id).all()
    vaccination_list = [{"id": v.id, "vaccination_name": v.vaccination_name, "date_vaccinated": v.date_vaccinated, "dose_type": v.dose_type} for v in vaccinations]

    allowed_status = ["completed", "booked", "on-going", "cancelled"]
    visits = db.query(Appointment).filter(Appointment.pet_id == pet_id, Appointment.status.in_(allowed_status)).all()
    visit_history = [
        {
            "appointment_id": appt.id,
            "date": appt.appointment_date.strftime("%Y-%m-%d"),
            "start_time": appt.start_time.strftime("%I:%M %p") if appt.start_time else None,
            "end_time": appt.end_time.strftime("%I:%M %p") if appt.end_time else None,
            "reason": appt.reason,
            "notes": appt.notes,
            "status": appt.status,
            "visit_type": appt.visit_type,
        }
        for appt in visits
    ]
    visit_history.sort(key=lambda v: datetime.strptime(f"{v['date']} {v['start_time']}", "%Y-%m-%d %I:%M %p") if v["start_time"] else datetime.strptime(v["date"], "%Y-%m-%d"), reverse=True)

    prescriptions = db.query(Prescription).join(Appointment, Prescription.appointment_id == Appointment.id).filter(Appointment.pet_id == pet_id).order_by(Prescription.created_at.desc()).all()
    prescription_list = [{"id": p.id, "appointment_id": p.appointment_id, "text": p.prescription_text, "file_url": p.file_url, "prescription_file_url": p.file_url, "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S")} for p in prescriptions]

    user = db.query(User).filter(User.id == user_id).first()
    owner_info = {
        "name": f"{user.first_name} {user.last_name}" if user else "",
        "address": "Hyderabad",
        "contact_number": user.phone_number if user else ""
    }

    data = {
        "visit_history": visit_history,
        "pet": {
            "id": pet.id,
            "name": pet.name,
            "species": pet.species,
            "gender": pet.gender,
            "breeding": breed_name,
            "age": pet.date_of_birth,
            "weight": float(pet.weight) if pet.weight else None,
            "licence": pet.licence,
            "profile_picture": pet.profile_picture,
        },
        "Owner": owner_info,
        "vaccinations": vaccination_list,
        "prescriptions": prescription_list
    }
    return standard_response(success=True, message="Pet details fetched successfully", data=data)


@router.post("/recoverPet/{pet_id}")
def recover_pet(pet_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == user_id, Pet.is_deleted == True).first()
    if not pet:
        return standard_response(success=False, message="Deleted pet not found", status_code=404)

    pet.is_deleted = False
    db.commit()
    db.refresh(pet)
    return standard_response(success=True, message="Pet recovered successfully", data={"pet_id": pet.id})


@router.delete("/deletePet/{pet_id}")
def delete_pet(pet_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == user_id).first()
    if not pet:
        return standard_response(success=False, message="Pet not found", status_code=404)

    pet.is_deleted = True
    db.commit()

    today = date.today()
    future_appointments = db.query(Appointment).filter(Appointment.pet_id == pet_id, Appointment.appointment_date >= today, Appointment.status.in_(["booked", "on-going"])).all()
    for appt in future_appointments:
        appt.status = "cancelled"
    db.commit()

    return standard_response(success=True, message="Pet deleted successfully. Future appointments cancelled.")
