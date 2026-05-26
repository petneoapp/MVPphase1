from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP
from database import Base
from datetime import datetime

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    vet_id = Column(Integer, ForeignKey("vets.id", ondelete="CASCADE"))
    token = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
