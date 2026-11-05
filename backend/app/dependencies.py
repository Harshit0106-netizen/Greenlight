"""Who is calling, and what role do they have."""
import jwt
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import forbidden, unauthorized
from app.models.user import User
from app.security import decode_access_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise unauthorized("Missing bearer token.")
    try:
        claims = decode_access_token(token)
    except jwt.PyJWTError:
        raise unauthorized("Invalid or expired token.")
    user = db.get(User, claims.get("sub"))
    if user is None:
        raise unauthorized("Unknown user.")
    return user  # role is always read from the database, never trusted from the token


def require_roles(*roles: str):
    def dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise forbidden(f"This action requires one of these roles: {', '.join(roles)}.")
        return user

    return dep
