from typing import Optional, Literal
from pydantic import BaseModel


class Actor(BaseModel):
    id: str
    name: str
    description: str


class FlowStep(BaseModel):
    order: int
    description: str
    actor: Optional[str] = None


class BusinessFlow(BaseModel):
    id: str
    name: str
    description: str
    actors: list[str] = []
    steps: list[FlowStep] = []
    related_rules: list[str] = []
    related_ac: list[str] = []


class BusinessRule(BaseModel):
    id: str
    description: str
    rationale: Optional[str] = None
    related_flows: list[str] = []


class AcceptanceCriteria(BaseModel):
    id: str
    given: str
    when: str
    then: str
    related_flow: str = ""
    related_rules: list[str] = []


class Feature(BaseModel):
    id: str
    name: str
    description: str
    related_flows: list[str] = []


class BRDContent(BaseModel):
    module_slug: Optional[str] = None
    module_prefix: Optional[str] = None
    actors: list[Actor] = []
    flows: list[BusinessFlow] = []
    rules: list[BusinessRule] = []
    criteria: list[AcceptanceCriteria] = []
    features: list[Feature] = []


class Ambiguity(BaseModel):
    id: str
    term: str
    context: str
    suggestion: str


class Conflict(BaseModel):
    rule_a: str
    rule_b: str
    description: str


class GeneratedOutputs(BaseModel):
    context_md: str
    uat_scripts: str
    test_cases: str
    rtm: str
    ambiguities: list[Ambiguity] = []
    conflicts: list[Conflict] = []


class RTMEntry(BaseModel):
    requirement_id: str
    requirement_name: str
    test_case_ids: list[str] = []
    code_files: list[str] = []
    status: Literal["covered", "partial", "missing"] = "missing"


class GapResult(BaseModel):
    requirement_id: str
    requirement_summary: str
    status: Literal["covered", "partial", "missing"]
    reason: str


class ImpactResult(BaseModel):
    affected_id: str
    affected_name: str
    impact_type: Literal["breaking", "modified", "new"]
    description: str
