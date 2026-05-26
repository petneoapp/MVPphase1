# utils/create_notify.py
from models.notification_models import Notification
from models.device_token import DeviceToken
from utils.notifications import send_fcm_message

def create_and_send(
    db,
    receiver_id,
    receiver_type,
    title=None,
    message=None,
    event_type=None,
    reference_id=None,
    redirect_to=None,
):
    """
    Create a notification in DB and send as FCM data message.
    """
    # 1. Create DB notification
    notif = Notification(
        receiver_id=receiver_id,
        receiver_type=receiver_type,
        title=title,
        message=message,
        event_type=event_type,
        reference_id=reference_id,
        redirect_to=redirect_to,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # 2. Construct data payload for FCM
    data_payload = {
        "notification_id": notif.id,
        "receiver_id": receiver_id,
        "receiver_type": receiver_type,
        "title": title or "",
        "message": message or "",
        "event_type": event_type or "",
        "reference_id": str(reference_id) if reference_id else "",
        "redirect_to": redirect_to or "",
    }

    # 3. Send to all device tokens
    tokens = db.query(DeviceToken).filter(
        DeviceToken.owner_id == receiver_id,
        DeviceToken.owner_type == receiver_type
    ).all()
    for t in tokens:
        send_fcm_message(t.fcm_token, data_payload)

    return notif
