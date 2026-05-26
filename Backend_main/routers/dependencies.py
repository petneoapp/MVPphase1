from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from utils.token import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_vet(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_access_token(token)
        vet_id = payload.get("vet_id")
        if not vet_id:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return vet_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")
