from typing import Literal, Optional
from pydantic import BaseModel

FileType = Literal["pdf", "docx", "markdown"]


class RawBRD(BaseModel):
    text: str
    source: str
    file_type: FileType


class BRDChunk(BaseModel):
    text: str
    index: int
    total: int
    module_hint: Optional[str] = None
