from sqlalchemy import Column, Integer, String
from database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class Qualification(Base):
    __tablename__ = "qualifications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)