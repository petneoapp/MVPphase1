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
from models.user_models import Pet, Vaccination, User, Breed
from utils.create_notify import create_and_send
from models.notification_models import Notification
from utils.response import standard_response
from utils.appointment_status_helper import sync_appointment_statuses

router = APIRouter(prefix='/appointments', tags=['Appointments'])


@router.patch("/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status: str,
    db: Session = Depends(get_db),
    vet_id: int = Depends(get_current_vet)
):
    """
    Update the status of an appointment by ID.
    Allowed status values: booked, completed, cancelled, no-show, on-going
    Only accessible by the logged-in vet.
    """
    allowed_status = ["booked", "completed", "cancelled", "no-show", "on-going"]

    status_lower = status.lower()
    if status_lower not in allowed_status:
        return standard_response(success=False, message=f"Invalid status. Allowed: {allowed_status}", status_code=400)

    appointment = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.vet_id == vet_id).first()
    if not appointment:
        return standard_response(success=False, message="Appointment not found or not assigned to you", status_code=404)

    appointment.status = status_lower
    db.commit()
    db.refresh(appointment)

    # Get user_id from Pet table using pet_id in appointment
    pet = db.query(Pet).filter(Pet.id == appointment.pet_id).first()
    if pet and pet.user_id:
        user_id = pet.user_id
        message = f"Your appointment for {pet.name} is {status_lower}."

        # Send notification to user
        create_and_send(
            db=db,
            receiver_id=user_id,
            receiver_type="user",
            title="Appointment Status Update",
            message=message,
            event_type="appointment_status_update",
            reference_id=appointment.id,
            redirect_to=f"/appointments/{appointment.id}"
        )

    return standard_response(
        success=True,
        message="Status updated successfully.",
        data={"updated_status": appointment.status}
    )


def format_time_12hr(time_obj):
    """Convert time object to 12-hour AM/PM string."""
    if not time_obj:
        return None
    return time_obj.strftime("%I:%M %p")


@router.get("/vetTodaySummary")
def get_vet_today_summary(
    db: Session = Depends(get_db),
    vet_id: int = Depends(get_current_vet)
):
    today = date.today()
    sync_appointment_statuses(db)

    # Get vet info
    vet = db.query(Vet).filter(Vet.id == vet_id).first()
    if not vet:
        return standard_response(success=False, message="Vet not found", status_code=404)

    # Only appointments for today for the logged-in vet
    appointments = (
        db.query(Appointment, Pet)
        .join(Pet, Pet.id == Appointment.pet_id, isouter=True)
        .filter(Appointment.appointment_date == today, Appointment.vet_id == vet_id)
        .all()
    )

    total = len(appointments)
    completed = sum(1 for (appt, _) in appointments if appt.status.lower() == "completed")

    now_time = datetime.now().time()

    upcoming = []
    for appt, pet in appointments:
        if appt.status.lower() in ["booked", "on-going"]:
            breed_name = None
            if pet and pet.breed_id:
                breed = db.query(Breed).filter(Breed.id == pet.breed_id).first()
                breed_name = breed.name if breed else None

            formatted_time = appt.start_time.strftime("%I:%M %p") if appt.start_time else None
            
            # Simple logic to add to upcoming if it's booked/on-going
            upcoming.append({
                "appointment_id": appt.id,
                "date": appt.appointment_date.strftime("%Y-%m-%d"),
                "time": formatted_time,
                "status": appt.status,
                "reason": appt.reason,
                "visit_type": appt.visit_type,
                "pet": {
                    "id": pet.id if pet else None,
                    "name": pet.name if pet else None,
                    "species": pet.species if pet else None,
                    "breed": breed_name,
                    "profile_picture": pet.profile_picture if pet else None
                }
            })

    # Sort upcoming by start_time
    upcoming.sort(key=lambda x: datetime.strptime(x["time"], "%I:%M %p"))

    # Count unread notifications
    unread_count = (
        db.query(Notification)
        .filter(
            Notification.receiver_type == "vet",
            Notification.receiver_id == vet_id,
            Notification.is_read == False,
        )
        .count()
    )

    data = {
        "vet_name": f"{vet.first_name} {vet.last_name}",
        "clinic_location": vet.location,
        "date": today.strftime("%Y-%m-%d"),
        "profile_picture_url": vet.profile_picture_url,
        "emergency": vet.emergency,
        "total_appointments": total,
        "completed": completed,
        "upcoming": upcoming,
        "notifications": unread_count
    }
    return standard_response(success=True, message="Today's summary fetched successfully", data=data)


@router.get("/myAppointments")
def get_vet_appointments(vet_id: int = Depends(get_current_vet), db: Session = Depends(get_db)):
    """
    Get upcoming, on-going, completed, and no-show appointments for a vet in one API.
    Sorted by appointment_date and appointment_time.
    """
    vet = db.query(Vet).filter(Vet.id == vet_id).first()
    if not vet:
        return standard_response(success=False, message="Vet not found", status_code=404)

    sync_appointment_statuses(db)

    today = date.today()
    now_time = datetime.now().time()
    
    appointments = db.query(Appointment).filter(Appointment.vet_id == vet_id).all()

    upcoming = []
    ongoing = []
    completed = []
    no_show = []

    for appt in appointments:
        pet = db.query(Pet).filter(Pet.id == appt.pet_id).first()
        breed_name = None
        if pet and pet.breed_id:
            breed = db.query(Breed).filter(Breed.id == pet.breed_id).first()
            breed_name = breed.name if breed else None

        formatted_time = appt.start_time.strftime("%I:%M %p") if appt.start_time else None
        
        current_status = appt.status.lower()

        appt_data = {
            "appointment_id": appt.id,
            "date": appt.appointment_date.strftime("%Y-%m-%d"),
            "time": formatted_time,
            "status": current_status,
            "reason": appt.reason,
            "visit_type": appt.visit_type,
            "pet": {
                "id": pet.id if pet else None,
                "name": pet.name if pet else None,
                "species": pet.species if pet else None,
                "breed": breed_name,
                "profile_picture": pet.profile_picture if pet else None
            }
        }

        if current_status == "booked":
            upcoming.append(appt_data)
        elif current_status == "on-going":
            ongoing.append(appt_data)
        elif current_status == "no-show":
            no_show.append(appt_data)
        else:  # completed, cancelled
            completed.append(appt_data)

    def sort_key(a):
        return datetime.strptime(f"{a['date']} {a['time']}", "%Y-%m-%d %I:%M %p")

    upcoming.sort(key=sort_key)
    ongoing.sort(key=sort_key)
    completed.sort(key=sort_key, reverse=True)
    no_show.sort(key=sort_key, reverse=True)

    data = {
        "upcoming": upcoming,
        "on-going": ongoing,
        "completed": completed,
        "no-show": no_show
    }
    return standard_response(success=True, message="Appointments fetched successfully", data=data)
