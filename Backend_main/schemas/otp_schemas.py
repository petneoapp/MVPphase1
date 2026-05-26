from pydantic import BaseModel, EmailStr


# Mobile OTP
class MobileOTPRequest(BaseModel):
    mobile_number: str


class VerifyMobileOTP(BaseModel):
    mobile_number: str
    otp: str


# Email OTP
class EmailOTPRequest(BaseModel):
    email: EmailStr


class VerifyEmailOTPRequest(BaseModel):
    email: EmailStr
    otp: str