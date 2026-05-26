from sqlalchemy import Column, Integer, String
from database import Base

class HomeContent(Base):
    __tablename__ = "home_content"

    screen_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
