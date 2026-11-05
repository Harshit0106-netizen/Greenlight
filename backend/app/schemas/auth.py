from typing import Literal

from pydantic import BaseModel

Role = Literal["creator", "manager", "reviewer", "brand_admin"]


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    role: Role
    workspace_id: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserOut
