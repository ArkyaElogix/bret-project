import sys
from app.database import SessionLocal
from app.models.models import AssessmentSession

if len(sys.argv) < 2:
    print("Usage: python check_session_owner.py <session_id>")
    sys.exit(1)

sid = int(sys.argv[1])
db = SessionLocal()
sess = db.get(AssessmentSession, sid)
if not sess:
    print("Session not found")
else:
    print("session.id:", sess.id)
    print("session.user_id:", sess.user_id)
    try:
        print("session.user.email:", sess.user.email if sess.user else None)
        print("session.user.name:", sess.user.name if sess.user else None)
    except Exception as e:
        print("Error reading related user:", e)
db.close()