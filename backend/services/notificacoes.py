import firebase_admin
from firebase_admin import messaging, credentials
from fastapi.concurrency import run_in_threadpool
import os


def _ensure_firebase_initialized() -> None:
    if firebase_admin._apps:
        return

    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if not credentials_path:
        raise RuntimeError("FIREBASE_CREDENTIALS_PATH is not set.")

    cred = credentials.Certificate(credentials_path)
    firebase_admin.initialize_app(cred)

class NotificationService:
    @staticmethod
    async def send_push_notification(token: str, title: str, body: str):
        _ensure_firebase_initialized()

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            token=token,
        )
        response = await run_in_threadpool(messaging.send, message)
        return response

    @staticmethod
    async def send_whatsapp_reminder(phone: str, message: str):
        pass