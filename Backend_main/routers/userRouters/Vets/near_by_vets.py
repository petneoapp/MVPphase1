from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.vet import Vet, VetService
from models.service import Service
from models.user_models import Review
from models.vet_availability import VetDayOverride, VetAvailability, VetBreak
from models.appointments import Appointment
from datetime import datetime, timedelta, date, time
from utils.response import standard_response

router = APIRouter(
    tags=["Near by Vets"]
)

EARTH_RADIUS_KM = 6371  # Earth radius in km
WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def get_vet_availability_status(db, vet_id: int, target_date: date):
    weekday = target_date.weekday()

    # 1. Check override for target_date
    override = db.query(VetDayOverride).filter(
        VetDayOverride.vet_id == vet_id,
        func.date(VetDayOverride.date) == target_date
    ).first()

    if override and override.is_closed:
        return "Closed"

    # 2. Get availability
    availability = None
    if override:
        availability = {
            "start_time": override.start_time,
            "end_time": override.end_time,
            "slot_duration": override.slot_duration or 30
        }
    else:
        base_availability = db.query(VetAvailability).filter(
            VetAvailability.vet_id == vet_id,
            VetAvailability.day_of_week == weekday,
            VetAvailability.is_closed == False
        ).first()
        if not base_availability:
            return "Not Available"

        availability = {
            "start_time": base_availability.start_time,
            "end_time": base_availability.end_time,
            "slot_duration": base_availability.slot_duration or 30
        }

    if not availability["start_time"] or not availability["end_time"]:
        return "Not Available"

    # 3. Generate slots
    slots = []
    slot_start = datetime.combine(target_date, availability["start_time"])
    slot_end = datetime.combine(target_date, availability["end_time"])
    while slot_start + timedelta(minutes=availability["slot_duration"]) <= slot_end:
        slots.append(slot_start)
        slot_start += timedelta(minutes=availability["slot_duration"])

    # subtract breaks
    breaks = db.query(VetBreak).join(VetAvailability).filter(
        VetAvailability.vet_id == vet_id
    ).all()
    for br in breaks:
        slots = [s for s in slots if not (br.start_time <= s.time() < br.end_time)]
    
    total_slots = len(slots)
    if total_slots == 0:
        return "Not Available"

    # 4. Count appointments
    booked_count = db.query(Appointment).filter(
        Appointment.vet_id == vet_id,
        Appointment.appointment_date == target_date,
        Appointment.status.in_(["booked", "on-going", "completed"])
    ).count()

    available_slots = total_slots - booked_count

    # 5. Decide status
    if available_slots <= 0:
        return "Not Available"
    elif available_slots <= 2:
        return "Available (Few slots left)"
    elif available_slots <= total_slots / 2:
        return "Available (Limited)"
    else:
        return "Available"


def format_time(t: time) -> str:
    """Format time as 09:00 AM style"""
    return t.strftime("%I:%M %p") if t else None


def get_weekly_schedule(db, vet_id: int):
    """Return weekly default schedule for the vet"""
    availabilities = db.query(VetAvailability).filter(
        VetAvailability.vet_id == vet_id
    ).order_by(VetAvailability.day_of_week).all()

    schedule = []
    for av in availabilities:
        if av.is_closed:
            schedule.append({
                "day": WEEKDAY_NAMES[av.day_of_week],
                "status": "Closed"
            })
        else:
            schedule.append({
                "day": WEEKDAY_NAMES[av.day_of_week],
                "status": f"{format_time(av.start_time)} - {format_time(av.end_time)}"
            })
    return schedule


@router.get("/nearby-vets")
def get_nearby_vets(
    user_lat: Optional[float] = Query(None, description="User latitude"),
    user_lon: Optional[float] = Query(None, description="User longitude"),
    radius_km: float = Query(5, description="Search radius in kilometers"),
    target_date: str = Query(None, description="Target date (YYYY-MM-DD). Default = today"),
    visit_type: str = Query(None, description="Visit type: In-clinic, Home-visit, Online"),
    service_ids: str = Query(None, description="Comma-separated service IDs to filter vets"),
    db: Session = Depends(get_db)
):
    # Parse date
    if target_date:
        try:
            target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            return standard_response(success=False, message="Invalid date format. Use YYYY-MM-DD", status_code=400)
    else:
        target_date = date.today()

    service_id_list = []
    if service_ids:
        try:
            service_id_list = [int(s.strip()) for s in service_ids.split(",") if s.strip()]
        except ValueError:
            return standard_response(success=False, message="Invalid service_ids. Must be comma-separated integers.", status_code=400)

    vets = []
    fallback_used = False

    try:
        if user_lat is None or user_lon is None:
            raise ValueError("Coordinates are missing")

        # Haversine formula for distance
        distance_expr = (
            EARTH_RADIUS_KM * func.acos(
                func.cos(func.radians(user_lat)) *
                func.cos(func.radians(Vet.clinic_latitude)) *
                func.cos(func.radians(Vet.clinic_longitude) - func.radians(user_lon)) +
                func.sin(func.radians(user_lat)) *
                func.sin(func.radians(Vet.clinic_latitude))
            )
        ).label("distance")

        query = (
            db.query(Vet, distance_expr)
            .filter(
                Vet.clinic_latitude.isnot(None),
                Vet.clinic_longitude.isnot(None),
                distance_expr <= radius_km
            )
        )

        if visit_type:
            visit_type_lower = visit_type.strip().lower()
            query = query.join(VetAvailability, VetAvailability.vet_id == Vet.id).filter(
                func.lower(func.array_to_string(VetAvailability.visit_types, ',')).like(f"%{visit_type_lower}%")
            )
        if service_id_list:
            query = query.join(VetService, VetService.vet_id == Vet.id).filter(
                VetService.service_id.in_(service_id_list)
            )

        vets = query.order_by(distance_expr).all()

        if not vets:
            fallback_used = True
    except Exception as e:
        fallback_used = True

    if fallback_used:
        # Allow all vets to show up in the fallback query for dev/testing
        fallback_query = db.query(Vet)
        if visit_type:
            visit_type_lower = visit_type.strip().lower()
            fallback_query = fallback_query.join(VetAvailability, VetAvailability.vet_id == Vet.id).filter(
                func.lower(func.array_to_string(VetAvailability.visit_types, ',')).like(f"%{visit_type_lower}%")
            )
        if service_id_list:
            fallback_query = fallback_query.join(VetService, VetService.vet_id == Vet.id).filter(
                VetService.service_id.in_(service_id_list)
            )
        all_vets = fallback_query.all()

        # If no verified vets are found (e.g. in dev/testing environments where vets are not yet verified),
        # return all vets to avoid showing an empty state on the frontend.
        if not all_vets:
            fallback_query = db.query(Vet)
            if visit_type:
                visit_type_lower = visit_type.strip().lower()
                fallback_query = fallback_query.join(VetAvailability, VetAvailability.vet_id == Vet.id).filter(
                    func.lower(func.array_to_string(VetAvailability.visit_types, ',')).like(f"%{visit_type_lower}%")
                )
            if service_id_list:
                fallback_query = fallback_query.join(VetService, VetService.vet_id == Vet.id).filter(
                    VetService.service_id.in_(service_id_list)
                )
            all_vets = fallback_query.all()

        vets = [(vet, 0.0) for vet in all_vets]

    data = []
    for vet, distance in vets:
        # Get services
        services_query = (
            db.query(Service.id, Service.name)
            .join(VetService, VetService.service_id == Service.id)
            .filter(VetService.vet_id == vet.id)
        )

        if service_id_list:
            services_query = services_query.filter(Service.id.in_(service_id_list))

        services = services_query.all()
        services_list = [{"id": s.id, "name": s.name} for s in services]
        
        visit_type_rows = db.query(VetAvailability.visit_types).filter(
            VetAvailability.vet_id == vet.id
        ).all()

        visit_types = set()
        for row in visit_type_rows:
            if row.visit_types:
                visit_types.update([v.lower() for v in row.visit_types])

        rating_data = db.query(
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("count")
        ).filter(Review.vet_id == vet.id).first()

        avg_rating = float(round(rating_data.avg_rating, 1)) if rating_data.avg_rating else 0.0
        rating_count = rating_data.count

        weekly_schedule = get_weekly_schedule(db, vet.id)

        data.append({
            "vet_id": vet.id,
            "name": f"Dr. {vet.first_name} {vet.last_name}",
            "experience": f"{vet.years_of_experience} years Exp" if vet.years_of_experience else None,
            "available_on": str(target_date),
            "availability_status": get_vet_availability_status(db, vet.id, target_date),
            "weekly_schedule": weekly_schedule,
            "clinic": {
                "address": vet.location,
                "name": vet.clinic_name,
                "latitude": float(vet.clinic_latitude) if vet.clinic_latitude is not None else None,
                "longitude": float(vet.clinic_longitude) if vet.clinic_longitude is not None else None,
            },
            "profile_picture": vet.profile_picture_url,
            "services": services_list,
            "visit_types": list(visit_types),
            "rating": {
                "average": avg_rating,
                "count": rating_count
            },
            "distance_km": float(round(distance, 2)) if distance is not None else 0.0
        })

    return standard_response(success=True, message="Nearby vets fetched successfully", data=data)
