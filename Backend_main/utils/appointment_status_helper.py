import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.appointments import Appointment
from utils.create_notify import create_and_send
from models.user_models import Pet

logger = logging.getLogger(__name__)

def sync_appointment_statuses(db: Session):
    """
    Synchronizes the statuses of appointments based on the current time and their state.
    - Moves 'booked' to 'on-going' once start_time is reached.
    - Moves 'booked' or 'on-going' to 'no-show' after 24 hours of start_time if Vet hasn't marked it completed.
    - Can be extended to send reminders.
    """
    now = datetime.now()
    today_date = now.date()
    current_time = now.time()

    # 1. Transition 'booked' -> 'on-going' when start time is reached, but hasn't exceeded 24 hours yet.
    # Note: Appointment date must be today (and time passed) OR in the past 24 hours.
    # Simplest way is to calculate the full appointment_datetime.
    
    # We query appointments that are either 'booked' or 'on-going'
    active_appointments = db.query(Appointment).filter(
        Appointment.status.in_(["booked", "on-going"])
    ).all()

    for appt in active_appointments:
        appt_datetime = appt.appointment_datetime
        time_elapsed = now - appt_datetime

        if appt.status == "booked":
            if time_elapsed >= timedelta(0) and time_elapsed < timedelta(hours=24):
                appt.status = "on-going"
                appt.status_changed_at = now
                logger.info(f"Appointment {appt.id} status changed to on-going.")

        if appt.status in ["booked", "on-going"]:
            if time_elapsed >= timedelta(hours=24):
                appt.status = "no-show"
                appt.no_show_tag = "Vet Not Attended"
                appt.no_show_reason = "System timeout: 24 hours passed without completion."
                appt.status_changed_at = now
                logger.info(f"Appointment {appt.id} status changed to no-show (timeout).")

                # Send a notification to the vet
                create_and_send(
                    db=db,
                    receiver_id=appt.vet_id,
                    receiver_type="vet",
                    title="Appointment No-Show",
                    message="An appointment was marked as no-show because 24 hours elapsed without completion.",
                    event_type="appointment_timeout",
                    reference_id=appt.id,
                    redirect_to=f"/appointments/{appt.id}"
                )
                
                # Send a notification to the user
                pet = db.query(Pet).filter(Pet.id == appt.pet_id).first()
                if pet and pet.user_id:
                    create_and_send(
                        db=db,
                        receiver_id=pet.user_id,
                        receiver_type="user",
                        title="Appointment Update",
                        message=f"Your appointment for {pet.name} was marked as no-show by the system.",
                        event_type="appointment_timeout",
                        reference_id=appt.id,
                        redirect_to=f"/appointments/{appt.id}"
                    )

    db.commit()
