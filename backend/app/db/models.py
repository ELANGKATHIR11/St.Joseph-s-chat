import uuid
from sqlalchemy import Column, String, DateTime, Float, JSON, Integer, ForeignKey
from sqlalchemy.sql import func
from app.db.postgres import Base

class AuditLog(Base):
    __tablename__ = "audit_events"

    request_id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    anonymized_user_id = Column(String(100), nullable=True)
    domain = Column(String(50))
    confidence = Column(Float)
    input_text = Column(String, nullable=True)  # Anonymized/redacted
    output_text = Column(String, nullable=True)  # Final response
    guardrail_decisions = Column(JSON)  # Dict of stage results
    latency_ms = Column(Integer)
    status = Column(String(50))

class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String(50), nullable=False)
    rating = Column(Integer)  # 1 to 5 or thumb up/down
    comments = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class SafeMemory(Base):
    __tablename__ = "conversation_memory_safe"

    session_id = Column(String(100), primary_key=True)
    summary = Column(String, nullable=True)
    language = Column(String(10), default="en")
    domain = Column(String(50), nullable=True)
    jurisdiction_preference = Column(String(100), nullable=True)
    preferences = Column(JSON, default=dict)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
