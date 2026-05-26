# =============================
# routers/vet_availability.py
# =============================
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, time as dtime
from typing import List, Dict, Tuple, Optional
from dependencies import get_current_vet, get_current_user
from database import get_db
from models.vet_availability import VetAvailability, VetBreak, VetDayOverride
from models.appointments import Appointment
from models.user_models import Pet
from models.vet import Vet
from schemas.vet_availability import (
    AvailabilityCreate,
    AvailabilityResponse,
    BreakCreate,
    BreakResponse,
    DayOverrideCreate,
    DayOverrideResponse,
    Slot,
)
from schemas.appointments import RescheduleRequest
from utils.create_notify import create_and_send
from utils.response import standard_response

availability_router = APIRouter(prefix="/availability", tags=["Vet Availability / Slot Generation"])

@availability_router.post("/{vet_id}/defaultAvailability")
def create_default_vet_availability(vet_id: int, body: List[AvailabilityCreate], db: Session = Depends(get_db)):
    created = []
    for item in body:
        if item.is_closed and (item.start_time or item.end_time):
            return standard_response(success=False, message="Closed day should not include start/end times", status_code=400)
        avail = VetAvailability(vet_id=vet_id, **item.dict())
        db.add(avail)
        created.append(avail)
    db.commit()
    data = [AvailabilityResponse.model_validate(av).model_dump() for av in created]
    return standard_response(success=True, message="Default availability created successfully", data=data)


@availability_router.get("/{vet_id}")
def list_availability(vet_id: int, db: Session = Depends(get_db)):
    avails = db.query(VetAvailability).filter(VetAvailability.vet_id == vet_id).all()
    data = [AvailabilityResponse.model_validate(av).model_dump() for av in avails]
    return standard_response(success=True, message="Availability list fetched successfully", data=data)


# ------- CRUD: Breaks -------
@availability_router.post("/break")
def create_break_for_vet_default_availability(body: BreakCreate, db: Session = Depends(get_db)):
    av = db.query(VetAvailability).filter(VetAvailability.id == body.availability_id).first()
    if not av:
        return standard_response(success=False, message="Availability not found", status_code=404)
    if body.start_time >= body.end_time:
        return standard_response(success=False, message="break start_time must be < end_time", status_code=400)
    bk = VetBreak(**body.dict())
    db.add(bk)
    db.commit()
    db.refresh(bk)
    return standard_response(success=True, message="Break created successfully", data=BreakResponse.model_validate(bk).model_dump())


@availability_router.get("/{vet_id}/breaks")
def list_breaks(vet_id: int, db: Session = Depends(get_db)):
    av_ids = [a.id for a in db.query(VetAvailability).filter(VetAvailability.vet_id == vet_id).all()]
    if not av_ids:
        return standard_response(success=True, message="No breaks found", data=[])

    rows = db.query(VetBreak).filter(VetBreak.availability_id.in_(av_ids)).all()
    data = [BreakResponse.model_validate(r).model_dump() for r in rows]
    return standard_response(success=True, message="Breaks fetched successfully", data=data)


# ------- CRUD: Day Overrides -------
@availability_router.post("/{vet_id}/override")
def create_day_override(vet_id: int, body: DayOverrideCreate, db: Session = Depends(get_db)):
    od = VetDayOverride(
        vet_id=vet_id,
        date=datetime.combine(body.date, dtime(0, 0)),
        is_closed=body.is_closed,
        start_time=body.start_time,
        end_time=body.end_time,
        slot_duration=body.slot_duration,
        visit_types=body.visit_types,
    )
    if not od.is_closed and (od.start_time and od.end_time) and od.start_time >= od.end_time:
        return standard_response(success=False, message="override start_time must be < end_time", status_code=400)
    db.add(od)
    db.commit()
    db.refresh(od)
    return standard_response(success=True, message="Day override created successfully", data=DayOverrideResponse.model_validate(od).model_dump())


@availability_router.get("/{vet_id}/overrides")
def list_overrides(vet_id: int, db: Session = Depends(get_db)):
    rows = db.query(VetDayOverride).filter(VetDayOverride.vet_id == vet_id).all()
    data = [DayOverrideResponse.model_validate(r).model_dump() for r in rows]
    return standard_response(success=True, message="Overrides fetched successfully", data=data)


@availability_router.get("/{vet_id}/slots")
def generate_slots(
    vet_id: int,
    days: int = Query(7, ge=1, le=14),
    debug: bool = Query(False),
    now: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    now = now or datetime.utcnow()
    end_dt = now + timedelta(days=days)

    defaults: List[VetAvailability] = (
        db.query(VetAvailability)
        .filter(
            VetAvailability.vet_id == vet_id,
            VetAvailability.is_closed == False,
        )
        .all()
    )

    breaks_map: Dict[int, List[Tuple[dtime, dtime]]] = {}
    if defaults:
        av_ids = [a.id for a in defaults]
        bk_rows: List[VetBreak] = db.query(VetBreak).filter(VetBreak.availability_id.in_(av_ids)).all()
        for b in bk_rows:
            breaks_map.setdefault(b.availability_id, []).append((b.start_time, b.end_time))

    overrides: List[VetDayOverride] = (
        db.query(VetDayOverride)
        .filter(
            VetDayOverride.vet_id == vet_id,
            VetDayOverride.date >= now.date(),
            VetDayOverride.date < end_dt.date(),
        )
        .all()
    )
    overrides_by_date: Dict[str, List[VetDayOverride]] = {}
    for od in overrides:
        key = od.date.isoformat()
        overrides_by_date.setdefault(key, []).append(od)

    appts: List[Appointment] = (
        db.query(Appointment)
        .filter(
            Appointment.vet_id == vet_id,
            Appointment.datetime_column() >= now,
            Appointment.datetime_column() < end_dt,
        )
        .all()
    )
    appt_map: Dict[str, Appointment] = {}
    for a in appts:
        adt = datetime.combine(a.appointment_date, a.start_time)
        key = adt.isoformat(timespec="minutes")
        appt_map[key] = a

    slots: List[Slot] = []
    seen: set[tuple] = set()

    def generate_from_window(day_date, start_t: dtime, end_t: dtime, slot_minutes: int,
                               allowed_types: List[str], av_id_for_breaks: Optional[int] = None):
        if not slot_minutes or slot_minutes <= 0:
            return

        day_breaks: List[Tuple[datetime, datetime]] = []
        if av_id_for_breaks and av_id_for_breaks in breaks_map:
            for (bs, be) in breaks_map[av_id_for_breaks]:
                day_breaks.append((datetime.combine(day_date, bs), datetime.combine(day_date, be)))

        cursor = datetime.combine(day_date, start_t)
        window_end = datetime.combine(day_date, end_t)

        while cursor + timedelta(minutes=slot_minutes) <= window_end:
            slot_end = cursor + timedelta(minutes=slot_minutes)
            if cursor >= now:
                overlap_break = False
                for (b_start, b_end) in day_breaks:
                    if not (slot_end <= b_start or cursor >= b_end):
                        overlap_break = True
                        break

                if not overlap_break:
                    key_tuple = (
                        day_date.isoformat(),
                        cursor.time().isoformat(timespec="minutes"),
                        slot_end.time().isoformat(timespec="minutes"),
                        tuple(sorted(allowed_types or [])),
                    )

                    if key_tuple not in seen:
                        seen.add(key_tuple)
                        appt_key = cursor.isoformat(timespec="minutes")
                        existing = appt_map.get(appt_key)
                        is_booked = bool(existing and (existing.status or '').lower() == 'booked')

                        if is_booked:
                            slots.append(
                                Slot(
                                    date=day_date,
                                    start_time=cursor.time(),
                                    end_time=slot_end.time(),
                                    status="booked",
                                    allowed_visit_types=allowed_types or [],
                                    appointment_id=existing.id,
                                    booked_visit_type=existing.visit_type,
                                    pet=existing.pet_id,
                                )
                            )
                        else:
                            slots.append(
                                Slot(
                                    date=day_date,
                                    start_time=cursor.time(),
                                    end_time=slot_end.time(),
                                    status="available",
                                    allowed_visit_types=allowed_types or [],
                                )
                            )
            cursor = slot_end

    for i in range(days):
        day = (now + timedelta(days=i)).date()
        w = day.weekday()
        date_key = day.isoformat()
        day_overrides = overrides_by_date.get(date_key, [])
        
        if day_overrides:
            if any(od.is_closed for od in day_overrides):
                continue
            default_first = next((a for a in defaults if a.day_of_week == w), None)
            for od in day_overrides:
                st = od.start_time
                et = od.end_time
                if not st or not et:
                    for av in [a for a in defaults if a.day_of_week == w]:
                        slot_min = od.slot_duration or av.slot_duration
                        vtypes = od.visit_types or av.visit_types
                        generate_from_window(day, av.start_time, av.end_time, slot_min, vtypes, av_id_for_breaks=av.id)
                else:
                    slot_min = od.slot_duration or (default_first.slot_duration if default_first else 30)
                    vtypes = od.visit_types or (default_first.visit_types if default_first else ["in-clinic", "online", "home-visit"])
                    generate_from_window(day, st, et, slot_min, vtypes, av_id_for_breaks=None)
            continue

        day_defaults = [a for a in defaults if a.day_of_week == w]
        for av in day_defaults:
            generate_from_window(day, av.start_time, av.end_time, av.slot_duration, av.visit_types, av_id_for_breaks=av.id)

    slots.sort(key=lambda s: (s.date, s.start_time))
    data = [s.dict() for s in slots] # Pydantic model to dict
    return standard_response(success=True, message="Slots generated successfully", data=data)


@availability_router.get("/{appointment_id}/rescheduleSlots")
def generate_reschedule_slots(
    appointment_id: int,
    days: int = 7,
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    end_dt = now + timedelta(days=days)
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        return standard_response(success=False, message="Appointment not found", status_code=404)

    vet_id = appt.vet_id
    defaults: List[VetAvailability] = db.query(VetAvailability).filter(
        VetAvailability.vet_id == vet_id,
        VetAvailability.is_closed == False
    ).all()
    av_ids = [a.id for a in defaults]

    breaks_map: Dict[int, List[Tuple[dtime, dtime]]] = {}
    bk_rows: List[VetBreak] = db.query(VetBreak).filter(VetBreak.availability_id.in_(av_ids)).all()
    for b in bk_rows:
        breaks_map.setdefault(b.availability_id, []).append((b.start_time, b.end_time))

    overrides: List[VetDayOverride] = db.query(VetDayOverride).filter(
        VetDayOverride.vet_id == vet_id,
        VetDayOverride.date >= now.date(),
        VetDayOverride.date < end_dt.date()
    ).all()
    overrides_by_date: Dict[str, List[VetDayOverride]] = {}
    for od in overrides:
        overrides_by_date.setdefault(od.date.isoformat(), []).append(od)

    appts: List[Appointment] = db.query(Appointment).filter(
        Appointment.vet_id == vet_id,
        Appointment.datetime_column() >= now,
        Appointment.datetime_column() < end_dt,
        Appointment.id != appointment_id
    ).all()
    appt_map: Dict[str, Appointment] = {}
    for a in appts:
        adt = datetime.combine(a.appointment_date, a.start_time)
        appt_map[adt.isoformat(timespec="minutes")] = a

    slots: List[Slot] = []
    seen: set[tuple] = set()

    def generate_from_window(day_date, start_t: dtime, end_t: dtime, slot_minutes: int,
                               allowed_types: List[str], av_id_for_breaks: Optional[int] = None):
        if not slot_minutes or slot_minutes <= 0:
            return
        day_breaks: List[Tuple[datetime, datetime]] = []
        if av_id_for_breaks and av_id_for_breaks in breaks_map:
            for (bs, be) in breaks_map[av_id_for_breaks]:
                day_breaks.append((datetime.combine(day_date, bs), datetime.combine(day_date, be)))

        cursor = datetime.combine(day_date, start_t)
        window_end = datetime.combine(day_date, end_t)

        while cursor + timedelta(minutes=slot_minutes) <= window_end:
            slot_end = cursor + timedelta(minutes=slot_minutes)
            if cursor >= now:
                overlap_break = any(not (slot_end <= b_start or cursor >= b_end) for (b_start, b_end) in day_breaks)
                if not overlap_break:
                    key_tuple = (day_date.isoformat(), cursor.time().isoformat(timespec="minutes"),
                                 slot_end.time().isoformat(timespec="minutes"), tuple(sorted(allowed_types or [])))
                    if key_tuple not in seen:
                        seen.add(key_tuple)
                        appt_key = cursor.isoformat(timespec="minutes")
                        existing = appt_map.get(appt_key)
                        is_booked = bool(existing and (existing.status or '').lower() == 'booked')

                        if is_booked:
                            slots.append(
                                Slot(
                                    date=day_date,
                                    start_time=cursor.time(),
                                    end_time=slot_end.time(),
                                    status="booked",
                                    allowed_visit_types=allowed_types or [],
                                    appointment_id=existing.id,
                                    booked_visit_type=existing.visit_type,
                                    pet=existing.pet_id,
                                )
                            )
                        else:
                            slots.append(
                                Slot(
                                    date=day_date,
                                    start_time=cursor.time(),
                                    end_time=slot_end.time(),
                                    status="available",
                                    allowed_visit_types=allowed_types or [],
                                )
                            )
            cursor = slot_end

    for i in range(days):
        day = (now + timedelta(days=i)).date()
        w = day.weekday()
        date_key = day.isoformat()
        day_overrides = overrides_by_date.get(date_key, [])
        if day_overrides:
            if any(od.is_closed for od in day_overrides):
                continue
            default_first = next((a for a in defaults if a.day_of_week == w), None)
            for od in day_overrides:
                st = od.start_time
                et = od.end_time
                slot_min = od.slot_duration or (default_first.slot_duration if default_first else 30)
                vtypes = od.visit_types or (default_first.visit_types if default_first else ["in-clinic", "online", "home-visit"])
                if not st or not et:
                    for av in [a for a in defaults if a.day_of_week == w]:
                        generate_from_window(day, av.start_time, av.end_time, slot_min, vtypes, av_id_for_breaks=av.id)
                else:
                    generate_from_window(day, st, et, slot_min, vtypes, av_id_for_breaks=None)
            continue
        for av in [a for a in defaults if a.day_of_week == w]:
            generate_from_window(day, av.start_time, av.end_time, av.slot_duration, av.visit_types, av_id_for_breaks=av.id)

    slots.sort(key=lambda s: (s.date, s.start_time))
    data = [s.dict() for s in slots]
    return standard_response(success=True, message="Reschedule slots generated successfully", data=data)


@availability_router.put("/reschedule/{appointment_id}")
def reschedule_appointment(appointment_id: int, request: RescheduleRequest, db: Session = Depends(get_db), vet_id: int = Depends(get_current_vet)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.vet_id == vet_id).first()
    if not appointment:
        return standard_response(success=False, message="Appointment not found", status_code=404)

    weekday = request.new_date.weekday()
    availability = db.query(VetAvailability).filter(
        VetAvailability.vet_id == appointment.vet_id,
        VetAvailability.day_of_week == weekday
    ).first()

    if not availability or request.visit_type not in (availability.visit_types or []):
        return standard_response(success=False, message="Selected slot does not support this visit type", status_code=400)

    conflict = db.query(Appointment).filter(
        Appointment.vet_id == appointment.vet_id,
        Appointment.appointment_date == request.new_date,
        Appointment.start_time < request.new_end_time,
        Appointment.end_time > request.new_start_time,
        Appointment.status == "booked",
        Appointment.id != appointment_id
    ).first()

    if conflict:
        return standard_response(success=False, message="Selected slot is not available", status_code=400)

    appointment.appointment_date = request.new_date
    appointment.start_time = request.new_start_time
    appointment.end_time = request.new_end_time
    appointment.visit_type = request.visit_type
    appointment.status = "booked"
    db.commit()
    db.refresh(appointment)

    pet = db.query(Pet).filter(Pet.id == appointment.pet_id).first()
    if pet and pet.user_id:
        date_str = request.new_date.strftime("%B %d, %Y")
        time_str = f"{request.new_start_time.strftime('%I:%M %p')} - {request.new_end_time.strftime('%I:%M %p')}"
        create_and_send(
            db=db,
            receiver_id=pet.user_id,
            receiver_type="user",
            title=f"Appointment for {pet.name} Rescheduled",
            message=f"Your appointment for {pet.name} has been rescheduled to {date_str} at {time_str}.",
            event_type="appointment",
            reference_id=appointment.id,
            redirect_to="reschedule_request"
        )
    return standard_response(success=True, message="Appointment rescheduled successfully", data={"appointment_id": appointment.id})


@availability_router.put("/user/reschedule/{appointment_id}")
def user_reschedule_appointment(
    appointment_id: int,
    request: RescheduleRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        return standard_response(success=False, message="Appointment not found", status_code=404)

    pet = db.query(Pet).filter(Pet.id == appointment.pet_id, Pet.user_id == user_id).first()
    if not pet:
        return standard_response(success=False, message="You are not authorized to reschedule this appointment", status_code=403)

    weekday = request.new_date.weekday()
    availability = db.query(VetAvailability).filter(
        VetAvailability.vet_id == appointment.vet_id,
        VetAvailability.day_of_week == weekday
    ).first()

    if not availability or request.visit_type not in (availability.visit_types or []):
        return standard_response(success=False, message="Selected slot does not support this visit type", status_code=400)

    conflict = db.query(Appointment).filter(
        Appointment.vet_id == appointment.vet_id,
        Appointment.appointment_date == request.new_date,
        Appointment.start_time < request.new_end_time,
        Appointment.end_time > request.new_start_time,
        Appointment.status == "booked",
        Appointment.id != appointment_id
    ).first()

    if conflict:
        return standard_response(success=False, message="Selected slot is not available", status_code=400)

    appointment.appointment_date = request.new_date
    appointment.start_time = request.new_start_time
    appointment.end_time = request.new_end_time
    appointment.visit_type = request.visit_type
    appointment.status = "booked"
    db.commit()
    db.refresh(appointment)

    vet = db.query(Vet).filter(Vet.id == appointment.vet_id).first()
    if vet:
        date_str = request.new_date.strftime("%B %d, %Y")
        time_str = f"{request.new_start_time.strftime('%I:%M %p')} - {request.new_end_time.strftime('%I:%M %p')}"
        create_and_send(
            db=db,
            receiver_id=vet.id,
            receiver_type="vet",
            title=f"Appointment Rescheduled for {pet.name}",
            message=f"The appointment has been rescheduled to {date_str} at {time_str}.",
            event_type="appointment_reschedule",
            reference_id=appointment.id,
            redirect_to=f"/appointments/{appointment.id}"
        )

    return standard_response(success=True, message="Appointment rescheduled successfully", data={"appointment_id": appointment.id})
