from passlib.context import CryptContext
from models import SessionLocal, User


def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)