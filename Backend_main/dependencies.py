from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader
from utils.token import decode_access_token

# simple "Authorization" header scheme
api_key_scheme = APIKeyHeader(name="Authorization")


def get_current_vet(token: str = Depends(api_key_scheme)):
    if token.startswith("Bearer "):
        token = token[7:]
    try:
        payload = decode_access_token(token)
        vet_id = payload.get("vet_id")
        if not vet_id:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return vet_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")


def get_current_user(token: str = Depends(api_key_scheme)):
    if token.startswith("Bearer "):
        token = token[7:]
    try:
        payload = decode_access_token(token)
        user_id: int = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")
