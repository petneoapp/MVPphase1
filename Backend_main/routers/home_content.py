from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import home_content as models
from schemas import home_content as schemas
from utils.response import standard_response

router = APIRouter(prefix="/homeContent", tags=["Application Home Content"])

# Get all home content entries
@router.get("")
def get_home_content(db: Session = Depends(get_db)):
    data = db.query(models.HomeContent).all()
    return standard_response(success=True, message="Home content fetched successfully", data=[schemas.HomeContentBase.model_validate(item).model_dump() for item in data])


# Get a specific home content by screen_id
@router.get("/{screen_id}")
def get_home_screen(screen_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.HomeContent).filter(models.HomeContent.screen_id == screen_id).first()
    if not entry:
        return standard_response(success=False, message="Home screen content not found", status_code=404)
    return standard_response(success=True, message="Home screen fetched successfully", data=schemas.HomeContentBase.model_validate(entry).model_dump())

"""

# Update a home screen by screen_id
@router.put("/{screen_id}", response_model=schemas.HomeContentBase)
def update_home_screen(screen_id: int, updated_data: schemas.HomeContentBase, db: Session = Depends(get_db)):
    entry = db.query(models.HomeContent).filter(models.HomeContent.screen_id == screen_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Home screen content not found")

    entry.title = updated_data.title
    entry.description = updated_data.description
    entry.image_url = updated_data.image_url
    db.commit()
    db.refresh(entry)
    return entry
"""