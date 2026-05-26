# utils/notifications.py
import os
import firebase_admin
from firebase_admin import credentials, messaging
import logging
import json

firebase_initialized = False

# initialize Firebase once
if not firebase_admin._apps:
    try:
        SA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'firebase', 'service_account.json'))
        if os.path.exists(SA_FILE):
            cred = credentials.Certificate(SA_FILE)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            logging.info("Firebase Admin SDK initialized successfully.")
        else:
            logging.error(f"Firebase service account file not found at: {SA_FILE}. Firebase notifications will be disabled.")
    except Exception as e:
        logging.exception(f"Failed to initialize Firebase Admin SDK: {e}")
else:
    firebase_initialized = True

def send_fcm_message(token: str, data_payload: dict) -> dict:
    """
    Send single-device FCM data message.
    data_payload: JSON dict to send in 'data' field of FCM.
    """
    if not firebase_initialized:
        logging.warning("FCM message send skipped because Firebase Admin SDK is not initialized.")
        return {"status": "skipped", "reason": "firebase_not_initialized"}

    if not token:
        return {"status": "skipped", "reason": "no_token"}

    # Convert values to string as FCM data messages require string values
    data_payload_str = {k: json.dumps(v) if isinstance(v, (dict, list)) else str(v) for k, v in data_payload.items()}

    message = messaging.Message(
        data=data_payload_str,
        token=token
    )

    try:
        resp = messaging.send(message)
        return {"status": "success", "response": resp}
    except Exception as e:
        logging.exception("FCM send failed")
        return {"status": "error", "error": str(e)}
