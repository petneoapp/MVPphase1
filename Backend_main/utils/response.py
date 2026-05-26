from typing import Any, Optional
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

def standard_response(success: bool, message: str, data: Any = None, status_code: int = 200):
    """
    Standardizes API responses into the format:
    {
      "success": true,
      "message": "Operation successful",
      "data": {}
    }
    """
    content = {
        "success": success,
        "message": message,
        "data": data if data is not None else {}
    }
    return JSONResponse(content=jsonable_encoder(content), status_code=status_code)

