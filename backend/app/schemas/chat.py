from pydantic import BaseModel, Field
from typing import Literal, List, Dict, Any, Optional

class GuardrailDecision(BaseModel):
    allowed: bool
    status: Literal["allowed", "rejected", "clarification_required", "emergency", "insufficient_evidence"]
    reason: str
    domain: Literal["medical", "legal", "mixed_medical_legal", "out_of_domain"]
    confidence: float = Field(ge=0, le=1)
    safety_flags: List[str] = []
    sanitized_input: Optional[str] = None
    redacted_input: Optional[str] = None
    requires_jurisdiction: bool = False
    requires_professional_help: bool = False

class Citation(BaseModel):
    document_id: str
    chunk_id: str
    title: str
    publisher: str
    source_url: str
    section: Optional[str] = None
    publication_date: Optional[str] = None
    relevance_score: float = Field(ge=0, le=1)

class GuardedChatResponse(BaseModel):
    status: Literal["success", "rejected", "clarification_required", "emergency", "insufficient_evidence"]
    domain: Literal["medical", "legal", "mixed_medical_legal", "out_of_domain"]
    confidence: float
    answer: str
    disclaimer: str
    citations: List[Citation] = []
    safety_flags: List[str] = []
    requires_professional_help: bool = False
    requires_jurisdiction: bool = False
    request_id: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    jurisdiction: Optional[str] = None
    language: Optional[str] = "en"
    user_id: Optional[str] = None

class FeedbackCreate(BaseModel):
    request_id: str
    rating: int = Field(ge=1, le=5)
    comments: Optional[str] = None
