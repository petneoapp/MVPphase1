"""
petneo/operational/models.py

SQLAlchemy ORM models for Phase 10B operational ecosystem tables.

IMPORTANT: These tables are SHADOW state during Phase 10B.
No application code reads from these tables yet. The outbox worker
writes to them; reconciliation reads from them for comparison only.

All ENUMs use create_type=False because the migrations create the
PostgreSQL types — SQLAlchemy must not try to create them again.
"""

from __future__ import annotations

import enum
import uuid
from sqlalchemy import (
    Column, Integer, BigInteger, SmallInteger, String, Text, Boolean,
    DateTime, Date, Time, DECIMAL, ForeignKey, Index, UniqueConstraint,
    CheckConstraint, text,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID, TSTZRANGE
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

# Use your existing Base — this is illustrative
from database import Base


# ─────────────────────────────────────────────────────────────
# ENUM DEFINITIONS
# ─────────────────────────────────────────────────────────────

class OrganizationType(str, enum.Enum):
    INDEPENDENT          = "independent"
    CLINIC               = "clinic"
    FRANCHISE            = "franchise"
    AGENCY               = "agency"
    MARKETPLACE_SELLER   = "marketplace_seller"
    ENTERPRISE_CHAIN     = "enterprise_chain"


class BranchType(str, enum.Enum):
    FIXED_LOCATION = "fixed_location"
    MOBILE_UNIT    = "mobile_unit"
    SERVICE_AREA   = "service_area"
    VIRTUAL        = "virtual"


class MarketplaceVisibility(str, enum.Enum):
    PUBLIC         = "public"
    VERIFIED_ONLY  = "verified_only"
    PRIVATE        = "private"
    DISABLED       = "disabled"


class CapabilityCategory(str, enum.Enum):
    MEDICAL    = "medical"
    WELLNESS   = "wellness"
    CARE       = "care"
    TRAINING   = "training"
    RETAIL     = "retail"
    EMERGENCY  = "emergency"


class ResourceType(str, enum.Enum):
    PERSON         = "person"
    ROOM           = "room"
    EQUIPMENT      = "equipment"
    VEHICLE        = "vehicle"
    CAPACITY_POOL  = "capacity_pool"


class PersonRole(str, enum.Enum):
    VET               = "vet"
    VET_ASSISTANT     = "vet_assistant"
    GROOMER           = "groomer"
    GROOMER_HELPER    = "groomer_helper"
    TRAINER           = "trainer"
    WALKER            = "walker"
    KENNEL_ATTENDANT  = "kennel_attendant"
    RECEPTIONIST      = "receptionist"
    ADMIN             = "admin"
    OTHER             = "other"


class CredentialStatus(str, enum.Enum):
    ACTIVE                = "active"
    EXPIRED               = "expired"
    SUSPENDED             = "suspended"
    REVOKED               = "revoked"
    PENDING_VERIFICATION  = "pending_verification"


class ScheduleExceptionType(str, enum.Enum):
    UNAVAILABLE    = "unavailable"
    EXTRA_HOURS    = "extra_hours"
    REPLACED_HOURS = "replaced_hours"


class ReservationStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class OutboxEventType(str, enum.Enum):
    VET_CREATED                       = "vet_created"
    VET_UPDATED                       = "vet_updated"
    VET_VERIFICATION_STATUS_CHANGED   = "vet_verification_status_changed"
    VET_DELETED                       = "vet_deleted"
    APPOINTMENT_CREATED               = "appointment_created"
    APPOINTMENT_UPDATED               = "appointment_updated"
    APPOINTMENT_STATUS_CHANGED        = "appointment_status_changed"
    APPOINTMENT_DELETED               = "appointment_deleted"
    PARTNER_CREATED                   = "partner_created"
    PARTNER_UPDATED                   = "partner_updated"
    BACKFILL_REPLAY                   = "backfill_replay"


class OutboxStatus(str, enum.Enum):
    PENDING             = "pending"
    PROCESSING          = "processing"
    PROCESSED           = "processed"
    FAILED              = "failed"
    PERMANENTLY_FAILED  = "permanently_failed"
    SKIPPED             = "skipped"


# Helper for named PostgreSQL enums
def _enum(py_enum, pg_name):
    return SAEnum(py_enum, name=pg_name, create_type=False, values_callable=lambda x: [m.value for m in x])


# ─────────────────────────────────────────────────────────────
# IDENTITY TIER
# ─────────────────────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id                       = Column(BigInteger, primary_key=True)
    slug                     = Column(String(120), nullable=False, unique=True)
    legal_name               = Column(String(255), nullable=False)
    display_name             = Column(String(255), nullable=False)
    org_type                 = Column(_enum(OrganizationType, "organization_type_enum"), nullable=False, default=OrganizationType.INDEPENDENT)

    parent_organization_id   = Column(BigInteger, ForeignKey("organizations.id"))

    verification_status      = Column(String(30), nullable=False, default="pending")
    verified_at              = Column(DateTime(timezone=True))
    verified_by_admin_id     = Column(Integer, ForeignKey("admin_users.id"))

    commission_rate_pct      = Column(DECIMAL(5, 2))
    gstin                    = Column(String(20))
    pan_number               = Column(String(20))

    legacy_vet_id            = Column(Integer)
    legacy_partner_id        = Column(Integer)

    is_active                = Column(Boolean, nullable=False, default=True)
    deactivated_at           = Column(DateTime(timezone=True))

    created_at               = Column(DateTime(timezone=True), server_default=func.now())
    updated_at               = Column(DateTime(timezone=True), server_default=func.now())

    branches = relationship("Branch", back_populates="organization")
    resources = relationship("Resource", back_populates="organization")


class Branch(Base):
    __tablename__ = "branches"

    id                       = Column(BigInteger, primary_key=True)
    organization_id          = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)

    slug                     = Column(String(120), nullable=False)
    name                     = Column(String(255), nullable=False)
    branch_type              = Column(_enum(BranchType, "branch_type_enum"), nullable=False, default=BranchType.FIXED_LOCATION)

    address_line1            = Column(Text)
    address_line2            = Column(Text)
    city                     = Column(String(100))
    state                    = Column(String(100))
    pincode                  = Column(String(10))
    country                  = Column(String(50), default="India")
    timezone                 = Column(String(50), nullable=False, default="Asia/Kolkata")
    latitude                 = Column(DECIMAL(10, 8))
    longitude                = Column(DECIMAL(11, 8))
    service_radius_km        = Column(Integer)

    contact_phone            = Column(String(20))
    contact_email            = Column(String(255))

    is_active                = Column(Boolean, nullable=False, default=True)
    is_accepting_bookings    = Column(Boolean, nullable=False, default=True)
    is_emergency_capable     = Column(Boolean, nullable=False, default=False)

    marketplace_visibility   = Column(_enum(MarketplaceVisibility, "marketplace_visibility_enum"), nullable=False, default=MarketplaceVisibility.PUBLIC)

    legacy_vet_id            = Column(Integer)
    legacy_clinic_name       = Column(String(255))

    created_at               = Column(DateTime(timezone=True), server_default=func.now())
    updated_at               = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="branches")
    operating_hours = relationship("BranchOperatingHours", back_populates="branch", cascade="all, delete-orphan")
    capabilities = relationship("BranchCapability", back_populates="branch")
    resources = relationship("Resource", back_populates="home_branch", foreign_keys="Resource.home_branch_id")

    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="ux_branches_org_slug"),
    )


class BranchOperatingHours(Base):
    __tablename__ = "branch_operating_hours"

    id              = Column(BigInteger, primary_key=True)
    branch_id       = Column(BigInteger, ForeignKey("branches.id"), nullable=False)
    day_of_week     = Column(SmallInteger, nullable=False)   # 0=Mon..6=Sun
    open_time       = Column(Time, nullable=False)
    close_time      = Column(Time, nullable=False)
    effective_from  = Column(Date, nullable=False, server_default=func.current_date())
    effective_until = Column(Date)
    is_active       = Column(Boolean, nullable=False, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch", back_populates="operating_hours")


# ─────────────────────────────────────────────────────────────
# SERVICE TIER (vocabulary)
# ─────────────────────────────────────────────────────────────

class ServiceCapability(Base):
    __tablename__ = "service_capabilities"

    id                           = Column(Integer, primary_key=True)
    code                         = Column(String(50), nullable=False, unique=True)
    display_name                 = Column(String(120), nullable=False)
    description                  = Column(Text)
    category                     = Column(_enum(CapabilityCategory, "capability_category_enum"), nullable=False)

    requires_certification       = Column(Boolean, nullable=False, default=False)
    default_duration_minutes     = Column(Integer, nullable=False, default=30)
    requires_pet_presence        = Column(Boolean, nullable=False, default=True)
    allows_remote_delivery       = Column(Boolean, nullable=False, default=False)

    is_active                    = Column(Boolean, nullable=False, default=True)
    deprecated_at                = Column(DateTime(timezone=True))
    deprecation_reason           = Column(Text)
    sort_order                   = Column(Integer, nullable=False, default=100)

    created_at                   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at                   = Column(DateTime(timezone=True), server_default=func.now())

    branch_assignments = relationship("BranchCapability", back_populates="capability")


class BranchCapability(Base):
    __tablename__ = "branch_capabilities"

    branch_id        = Column(BigInteger, ForeignKey("branches.id"), primary_key=True)
    capability_id    = Column(Integer, ForeignKey("service_capabilities.id"), primary_key=True)
    is_active        = Column(Boolean, nullable=False, default=True)
    notes            = Column(Text)
    added_at         = Column(DateTime(timezone=True), server_default=func.now())
    deactivated_at   = Column(DateTime(timezone=True))

    branch     = relationship("Branch", back_populates="capabilities")
    capability = relationship("ServiceCapability", back_populates="branch_assignments")


# ─────────────────────────────────────────────────────────────
# RESOURCE TIER
# ─────────────────────────────────────────────────────────────

class Resource(Base):
    __tablename__ = "resources"

    id                  = Column(BigInteger, primary_key=True)
    organization_id     = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    home_branch_id      = Column(BigInteger, ForeignKey("branches.id"), nullable=False)

    resource_type       = Column(_enum(ResourceType, "resource_type_enum"), nullable=False)
    name                = Column(String(255), nullable=False)
    display_name        = Column(String(255))

    person_user_id      = Column(Integer, ForeignKey("users.id"))
    person_first_name   = Column(String(120))
    person_last_name    = Column(String(120))

    metadata_           = Column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    is_active           = Column(Boolean, nullable=False, default=True)
    is_bookable         = Column(Boolean, nullable=False, default=True)

    legacy_vet_id       = Column(Integer)

    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), server_default=func.now())

    organization     = relationship("Organization", back_populates="resources")
    home_branch      = relationship("Branch", back_populates="resources", foreign_keys=[home_branch_id])
    capabilities     = relationship("ResourceCapability", back_populates="resource", cascade="all, delete-orphan")
    credentials      = relationship("ResourceCredential", back_populates="resource", cascade="all, delete-orphan")
    person_roles     = relationship("PersonRoleAssignment", back_populates="resource", cascade="all, delete-orphan")


class ResourceCapability(Base):
    __tablename__ = "resource_capabilities"

    resource_id                 = Column(BigInteger, ForeignKey("resources.id"), primary_key=True)
    capability_id               = Column(Integer, ForeignKey("service_capabilities.id"), primary_key=True)
    is_currently_performable    = Column(Boolean, nullable=False, default=True)
    authorizing_credential_id   = Column(BigInteger, ForeignKey("resource_credentials.id"))
    last_validated_at           = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    resource     = relationship("Resource", back_populates="capabilities")


class PersonRoleAssignment(Base):
    __tablename__ = "person_roles"

    resource_id   = Column(BigInteger, ForeignKey("resources.id"), primary_key=True)
    role          = Column(_enum(PersonRole, "person_role_enum"), primary_key=True)
    is_primary    = Column(Boolean, nullable=False, default=False)
    assigned_at   = Column(DateTime(timezone=True), server_default=func.now())

    resource      = relationship("Resource", back_populates="person_roles")


class ResourceCredential(Base):
    __tablename__ = "resource_credentials"

    id                          = Column(BigInteger, primary_key=True)
    resource_id                 = Column(BigInteger, ForeignKey("resources.id"), nullable=False)
    authorizes_capability_id    = Column(Integer, ForeignKey("service_capabilities.id"))

    credential_type             = Column(String(80), nullable=False)
    credential_number           = Column(String(120))
    issuing_authority           = Column(String(255))

    issued_at                   = Column(Date)
    valid_from                  = Column(Date, nullable=False)
    valid_until                 = Column(Date)

    status                      = Column(_enum(CredentialStatus, "credential_status_enum"), nullable=False, default=CredentialStatus.PENDING_VERIFICATION)
    verified_at                 = Column(DateTime(timezone=True))
    verified_by_admin_id        = Column(Integer, ForeignKey("admin_users.id"))
    revoked_at                  = Column(DateTime(timezone=True))
    revoke_reason               = Column(Text)
    document_url                = Column(Text)

    created_at                  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at                  = Column(DateTime(timezone=True), server_default=func.now())

    resource = relationship("Resource", back_populates="credentials")


class ResourceBranchAssignment(Base):
    __tablename__ = "resource_branch_assignments"

    id                 = Column(BigInteger, primary_key=True)
    resource_id        = Column(BigInteger, ForeignKey("resources.id"), nullable=False)
    branch_id          = Column(BigInteger, ForeignKey("branches.id"), nullable=False)
    days_of_week_mask  = Column(SmallInteger, nullable=False, default=0)
    effective_from     = Column(Date, nullable=False, server_default=func.current_date())
    effective_until    = Column(Date)
    is_active          = Column(Boolean, nullable=False, default=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())
    updated_at         = Column(DateTime(timezone=True), server_default=func.now())


# ─────────────────────────────────────────────────────────────
# SCHEDULE TIER
# ─────────────────────────────────────────────────────────────

class ResourceDefaultSchedule(Base):
    __tablename__ = "resource_default_schedules"

    id                  = Column(BigInteger, primary_key=True)
    resource_id         = Column(BigInteger, ForeignKey("resources.id"), nullable=False)
    branch_id           = Column(BigInteger, ForeignKey("branches.id"), nullable=False)
    day_of_week         = Column(SmallInteger, nullable=False)
    start_time          = Column(Time, nullable=False)
    end_time            = Column(Time, nullable=False)
    effective_from      = Column(Date, nullable=False, server_default=func.current_date())
    effective_until     = Column(Date)
    is_active           = Column(Boolean, nullable=False, default=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), server_default=func.now())


class ResourceScheduleException(Base):
    __tablename__ = "resource_schedule_exceptions"

    id                      = Column(BigInteger, primary_key=True)
    resource_id             = Column(BigInteger, ForeignKey("resources.id"), nullable=False)
    branch_id               = Column(BigInteger, ForeignKey("branches.id"))
    exception_date          = Column(Date, nullable=False)
    exception_type          = Column(_enum(ScheduleExceptionType, "schedule_exception_type_enum"), nullable=False)
    start_time              = Column(Time)
    end_time                = Column(Time)
    reason                  = Column(Text)
    notes                   = Column(Text)
    created_by_user_id      = Column(Integer, ForeignKey("users.id"))
    created_by_admin_id     = Column(Integer, ForeignKey("admin_users.id"))
    created_at              = Column(DateTime(timezone=True), server_default=func.now())
    updated_at              = Column(DateTime(timezone=True), server_default=func.now())


class ResourceAvailabilityWindow(Base):
    __tablename__ = "resource_availability_windows"

    id                       = Column(BigInteger, primary_key=True)
    resource_id              = Column(BigInteger, ForeignKey("resources.id"), nullable=False)
    branch_id                = Column(BigInteger, ForeignKey("branches.id"), nullable=False)
    window_range             = Column(TSTZRANGE, nullable=False)
    derived_from_default     = Column(Boolean, nullable=False, default=True)
    has_exception_applied    = Column(Boolean, nullable=False, default=False)
    generated_at             = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    generation_run_id        = Column(UUID(as_uuid=True), nullable=False)


class ScheduleMaterializationRun(Base):
    __tablename__ = "schedule_materialization_runs"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_type              = Column(String(40), nullable=False)
    resource_id           = Column(BigInteger)
    branch_id             = Column(BigInteger)
    window_start          = Column(DateTime(timezone=True), nullable=False)
    window_end            = Column(DateTime(timezone=True), nullable=False)
    status                = Column(String(20), nullable=False, default="running")
    resources_processed   = Column(Integer, nullable=False, default=0)
    windows_generated     = Column(Integer, nullable=False, default=0)
    windows_deleted       = Column(Integer, nullable=False, default=0)
    error_message         = Column(Text)
    started_at            = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at          = Column(DateTime(timezone=True))
    duration_ms           = Column(Integer)


# ─────────────────────────────────────────────────────────────
# MIGRATION OUTBOX
# ─────────────────────────────────────────────────────────────

class MigrationOutbox(Base):
    __tablename__ = "migration_outbox"

    id                       = Column(BigInteger, primary_key=True)
    event_type               = Column(_enum(OutboxEventType, "outbox_event_type_enum"), nullable=False)
    event_uuid               = Column(UUID(as_uuid=True), nullable=False, default=uuid.uuid4)
    legacy_table             = Column(String(50), nullable=False)
    legacy_id                = Column(BigInteger, nullable=False)
    payload                  = Column(JSONB, nullable=False)
    status                   = Column(_enum(OutboxStatus, "outbox_status_enum"), nullable=False, default=OutboxStatus.PENDING)
    attempt_count            = Column(SmallInteger, nullable=False, default=0)
    last_attempt_at          = Column(DateTime(timezone=True))
    next_retry_at            = Column(DateTime(timezone=True))
    error_message            = Column(Text)
    error_traceback          = Column(Text)
    processing_worker_id     = Column(String(120))
    processing_started_at    = Column(DateTime(timezone=True))
    new_table_changes        = Column(JSONB)
    created_at               = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    processed_at             = Column(DateTime(timezone=True))


class MigrationDivergence(Base):
    __tablename__ = "migration_divergence"

    id                       = Column(BigInteger, primary_key=True)
    legacy_table             = Column(String(50), nullable=False)
    legacy_id                = Column(BigInteger, nullable=False)
    new_table                = Column(String(50), nullable=False)
    new_id                   = Column(BigInteger)
    field_name               = Column(String(120), nullable=False)
    legacy_value             = Column(Text)
    new_value                = Column(Text)
    severity                 = Column(String(20), nullable=False, default="warning")
    is_resolved              = Column(Boolean, nullable=False, default=False)
    resolution_notes         = Column(Text)
    resolved_at              = Column(DateTime(timezone=True))
    resolved_by_admin_id     = Column(Integer, ForeignKey("admin_users.id"))
    detected_at              = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class MigrationReconciliationRun(Base):
    __tablename__ = "migration_reconciliation_runs"

    id                       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    legacy_table             = Column(String(50), nullable=False)
    sample_size              = Column(Integer, nullable=False)
    sample_window_hours      = Column(Integer, nullable=False)
    rows_compared            = Column(Integer, nullable=False, default=0)
    divergences_found        = Column(Integer, nullable=False, default=0)
    new_rows_missing         = Column(Integer, nullable=False, default=0)
    started_at               = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at             = Column(DateTime(timezone=True))
    duration_ms              = Column(Integer)
    status                   = Column(String(20), nullable=False, default="running")


# ─────────────────────────────────────────────────────────────
# RESERVATION TIER
# ─────────────────────────────────────────────────────────────

class ResourceReservation(Base):
    __tablename__ = 'resource_reservations'

    id                          = Column(BigInteger, primary_key=True, autoincrement=True)
    resource_id                 = Column(BigInteger, ForeignKey("resources.id", ondelete="RESTRICT"), nullable=False)
    
    # We map tstzrange to a string representation in SQLAlchemy for simplicity,
    # or handle it via raw SQL where ranges are necessary.
    reservation_range           = Column(String, nullable=False)
    status                      = Column(_enum(ReservationStatus, "reservation_status_enum"), nullable=False, default=ReservationStatus.PENDING)
    
    source_type                 = Column(String(50), nullable=False)
    source_id                   = Column(String(100))
    
    created_at                  = Column(DateTime(timezone=True), default=func.now())
    updated_at                  = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
