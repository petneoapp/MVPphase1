from pydantic import BaseModel


class ServiceBase(BaseModel):
    name: str


class ServiceCreate(ServiceBase):
    pass


class ServiceOut(ServiceBase):
    id: int

    class Config:
        from_attributes = True


class QualificationBase(BaseModel):
    name: str


class QualificationCreate(QualificationBase):
    pass


class QualificationResponse(QualificationBase):
    id: int

    class Config:
        from_attributes = True
