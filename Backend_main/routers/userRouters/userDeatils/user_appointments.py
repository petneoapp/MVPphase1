from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.appointments import Appointment
from models.vet import Vet
from models.service import Service
from schemas.appointments import AppointmentCreate, AppointmentResponse, AppointmentListResponse
from dependencies import get_current_vet, get_current_user
from datetime import date, datetime
from typing import List, Dict
from models.user_models import Pet, Vaccination, User, Breed, UserAddress
from utils.create_notify import create_and_send
from utils.response import standard_response
from utils.appointment_status_helper import sync_appointment_statuses

router = APIRouter(prefix="/appointment", tags=["User Appointment"])

today = date.today()

# Function auto_complete_past_appointments removed; using sync_appointment_statuses instead.

def sort_key(item):
    appt_date = datetime.strptime(item["date"], "%Y-%m-%d").date()
    if appt_date == today:
        priority = 0   # Today first
    elif appt_date > today:
        priority = 1   # Upcoming
    else:
        priority = 2   # Past
    return (priority, appt_date)

@router.post('/add')
def add_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    #  Validate visit_type
    valid_visit_types = ["in-clinic", "online", "home-visit"]
    if appointment.visit_type.lower() not in valid_visit_types:
        return standard_response(success=False, message=f"Invalid visit_type. Must be one of {valid_visit_types}.", status_code=400)

    #  Check if slot is available
    existing = db.query(Appointment).filter(
        Appointment.vet_id == appointment.vet_id,
        Appointment.appointment_date == appointment.appointment_date,
        Appointment.start_time == appointment.start_time,
        Appointment.status.in_(["booked", "on-going"])
    ).first()
    
    if existing:
        return standard_response(success=False, message="This slot has already been booked. Please try another time.", status_code=400)

    data = appointment.dict()

    new_appointment = Appointment(
        **data,
        created_at=datetime.utcnow(),
        status="booked"
    )

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    # Send Notification
    create_and_send(
        db=db,
        receiver_id=appointment.vet_id,
        receiver_type="vet",
        title="New Appointment Booked",
        message=f"Appointment booked on {new_appointment.appointment_date} at {new_appointment.start_time}. Click for more details",
        event_type="appointment",
        reference_id=new_appointment.id,
        redirect_to=f"/appointments/{new_appointment.id}"
    )

    return standard_response(success=True, message="Appointment booked successfully", data={"appointment_id": new_appointment.id})


@router.patch("/{appointment_id}/status")
def update_user_appointment_status(
    appointment_id: int,
    status: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    allowed_status = ["booked", "cancelled"]
    status_lower = status.lower()
    if status_lower not in allowed_status:
        return standard_response(success=False, message=f"Invalid status. Allowed: {allowed_status}", status_code=400)

    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )
    if not appointment:
        return standard_response(success=False, message="Appointment not found.", status_code=404)

    appointment.status = status_lower
    db.commit()
    db.refresh(appointment)

    # If appointment cancelled, notify the vet
    if status_lower == "cancelled":
        create_and_send(
            db=db,
            receiver_id=appointment.vet_id,
            receiver_type="vet",
            title="Appointment Cancelled",
            message=f"The appointment scheduled on {appointment.appointment_date} at {appointment.start_time} has been cancelled by the user.",
            event_type="appointment",
            reference_id=appointment.id,
            redirect_to=f"/appointments/{appointment.id}"
        )
    return standard_response(success=True, message="Status updated successfully.", data={
        "updated_status": appointment.status,
        "appointment_id": appointment.id
    })


@router.get("/myAppointments")
def get_user_appointments(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sync_appointment_statuses(db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return standard_response(success=False, message="User not found", status_code=404)

    pets = db.query(Pet).filter(Pet.user_id == user_id, Pet.is_deleted == False).all()
    pet_ids = [pet.id for pet in pets]

    if not pet_ids:
        return standard_response(success=True, message="No appointments found", data={"appointments": []})

    appointments = (
        db.query(Appointment)
        .filter(Appointment.pet_id.in_(pet_ids))
        .order_by(Appointment.appointment_date, Appointment.start_time)
        .all()
    )

    appt_data = []
    for appt in appointments:
        pet = db.query(Pet).filter(Pet.id == appt.pet_id).first()
        breed_name = None
        if pet and pet.breed_id:
            breed = db.query(Breed).filter(Breed.id == pet.breed_id).first()
            breed_name = breed.name if breed else None

        vet = db.query(Vet).filter(Vet.id == appt.vet_id).first()
        vet_name = f"{vet.first_name} {vet.last_name}" if vet else None
        vet_specialization = vet.specialization if vet else None

        formatted_time = appt.start_time.strftime("%I:%M %p") if appt.start_time else None
        visit_purpose = "Emergency visit" if appt.is_emergency else "General visit"

        appt_data.append({
            "appointment_id": appt.id,
            "date": appt.appointment_date.strftime("%Y-%m-%d"),
            "time": formatted_time,
            "status": appt.status.lower() if appt.status else None,
            "reason": appt.reason,
            "visit_type": appt.visit_type,
            "visit_purpose": visit_purpose,
            "vet": {
                "id": vet.id if vet else None,
                "name": vet_name,
                "profile": vet.profile_picture_url if vet else None,
                "specialization": vet_specialization,
                "clinic_name": vet.clinic_name if vet else None
            },
            "pet": {
                "id": pet.id if pet else None,
                "name": pet.name if pet else None,
                "species": pet.species if pet else None,
                "breed": breed_name,
                "profile_picture": pet.profile_picture if pet else None
            }
        })
    appt_data = sorted(appt_data, key=sort_key)
    return standard_response(success=True, message="Appointments fetched successfully", data={"appointments": appt_data})


@router.get("/{appointment_id}")
def get_appointment_details(
    appointment_id: int,
    db: Session = Depends(get_db)
):
    sync_appointment_statuses(db)
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        return standard_response(success=False, message="Appointment not found", status_code=404)

    vet = db.query(Vet).filter(Vet.id == appt.vet_id).first()
    pet = db.query(Pet).filter(Pet.id == appt.pet_id).first()
    petName = pet.name if pet else None

    address = None
    if appt.address_id:
        visit_address = db.query(UserAddress).filter(UserAddress.id == appt.address_id).first()
        if visit_address:
            address = {
                "address": visit_address.address,
                "latitude": float(visit_address.latitude) if visit_address.latitude else None,
                "longitude": float(visit_address.longitude) if visit_address.longitude else None
            }
    service = db.query(Service).filter(Service.id == appt.service_id).first() if appt.service_id else None
    formatted_time = appt.start_time.strftime("%I:%M %p") if appt.start_time else None

    data = {
        "vet_name": f"{vet.first_name} {vet.last_name}" if vet else None,
        "visit_type": appt.visit_type,
        "petName": petName,
        "service": service.name if service else None,
        "status": appt.status.lower() if appt.status else None,
        "appointment_date": appt.appointment_date.strftime("%Y-%m-%d"),
        "appointment_time": formatted_time,
        "clinic_name": vet.clinic_name if vet else None,
        "clinic_location": vet.location if vet else None,
        "Visit_address": address
    }
    return standard_response(success=True, message="Appointment details fetched successfully", data=data)


@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        return standard_response(success=False, message="Appointment not found", status_code=404)

    # Check if the pet belongs to the user
    pet = db.query(Pet).filter(Pet.id == appointment.pet_id, Pet.user_id == user_id).first()
    if not pet:
        return standard_response(success=False, message="You are not authorized to delete this appointment", status_code=403)

    db.delete(appointment)
    db.commit()
    return standard_response(success=True, message="Appointment deleted successfully")
