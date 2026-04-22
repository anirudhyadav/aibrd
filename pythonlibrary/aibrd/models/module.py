from typing import Literal
from pydantic import BaseModel

WorkspaceMode = Literal["flat", "modular"]


class DetectedModule(BaseModel):
    display_name: str
    slug: str
    prefix: str
    confidence: Literal["high", "low"]


class ModuleCounters(BaseModel):
    BF: int = 0
    BR: int = 0
    AC: int = 0
    FT: int = 0
    TC: int = 0
    RN: int = 0


class ModuleConfig(BaseModel):
    display_name: str
    prefix: str
    counters: ModuleCounters = ModuleCounters()


class SharedCounters(BaseModel):
    ACT: int = 0
    GBR: int = 0


class Registry(BaseModel):
    mode: WorkspaceMode = "flat"
    modules: dict[str, ModuleConfig] = {}
    shared: SharedCounters = SharedCounters()
