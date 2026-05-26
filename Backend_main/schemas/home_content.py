from pydantic import BaseModel

class HomeContentBase(BaseModel):
    screen_id: int
    title: str
    description: str
    image_url: str

    class Config:
        from_attributes = True