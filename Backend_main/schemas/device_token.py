from pydantic import BaseModel

class DeviceTokenIn(BaseModel):
    owner_id: int
    owner_type: str   # 'user' or 'vet'
    fcm_token: str
    device_type: str = None
