from typing import Literal

from pydantic import BaseModel, Field

SourceKind = Literal["guideline", "fact", "term", "asset"]


class SourceOut(BaseModel):
    id: str
    kind: SourceKind
    title: str
    text: str
    version: str
    status: str


class SourceCreate(BaseModel):
    kind: SourceKind
    title: str = Field(min_length=1, max_length=300)
    text: str = Field(min_length=1, max_length=5000)
