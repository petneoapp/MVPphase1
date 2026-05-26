from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models.user_models import User, UserAddress
from schemas.userSchemas.user_address import AddressCreate, AddressResponse, UserWithAddresses, AddressUpdate
from database import get_db
from dependencies import get_current_user
from utils.response import standard_response

router = APIRouter(prefix="/address", tags=["User Addresses"])


@router.post("/add")
def add_address(
    address_in: AddressCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        return standard_response(success=False, message="User not found", status_code=404)

    # Check if the user already has addresses
    has_address = db.query(UserAddress).filter(UserAddress.user_id == user_id).first()
    new_address = UserAddress(
        user_id=user.id,
        **address_in.dict(),
        is_default=False if has_address else True  # auto-default for first one
    )

    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return standard_response(success=True, message="Address added successfully")


@router.get("/myAddresses")
def get_addresses(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    addresses = (
        db.query(UserAddress)
        .filter(UserAddress.user_id == user_id)
        .order_by(UserAddress.created_at.desc())
        .all()
    )
    data = [AddressResponse.model_validate(addr).model_dump() for addr in addresses]
    return standard_response(success=True, message="Addresses fetched successfully", data=data)


@router.put("/{address_id}")
def update_address(
    address_id: int,
    update_in: AddressUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    address = (
        db.query(UserAddress)
        .filter(UserAddress.id == address_id, UserAddress.user_id == user_id)
        .first()
    )
    if not address:
        return standard_response(success=False, message="Address not found", status_code=404)

    for field, value in update_in.dict(exclude_unset=True).items():
        setattr(address, field, value)

    db.commit()
    db.refresh(address)
    return standard_response(success=True, message="Address updated successfully")


@router.delete("/{address_id}")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    address = (
        db.query(UserAddress)
        .filter(UserAddress.id == address_id, UserAddress.user_id == user_id)
        .first()
    )
    if not address:
        return standard_response(success=False, message="Address not found", status_code=404)

    db.delete(address)
    db.commit()
    return standard_response(success=True, message="Address deleted successfully")


@router.put("/{address_id}/set-default")
def set_default_address(
    address_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    # Unset existing default
    db.query(UserAddress).filter(UserAddress.user_id == user_id).update({"is_default": False})
    
    # Set new default
    address = db.query(UserAddress).filter(UserAddress.id == address_id, UserAddress.user_id == user_id).first()
    if not address:
        db.rollback()
        return standard_response(success=False, message="Address not found", status_code=404)
    
    address.is_default = True
    db.commit()
    return standard_response(success=True, message="Default address updated successfully")
