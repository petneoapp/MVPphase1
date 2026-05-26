from pydantic import BaseModel, EmailStr


# Mobile OTP
class UserMobileOTPRequest(BaseModel):
    mobile_number: str


class VerifyUserMobileOTP(BaseModel):
    mobile_number: str
    otp: str
