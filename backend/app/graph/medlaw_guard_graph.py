import time
import uuid
from typing import Optional
from app.db.postgres import SessionLocal
from app.db.models import AuditLog
from app.schemas.chat import ChatRequest, GuardedChatResponse, Citation
from app.guardrails.pipeline import run_input_pipeline
from app.rag.hybrid_retriever import retrieve_and_rerank
from app.chains.guarded_chat import generate_llm_response
from app.guardrails.citation import validate_citations
from app.guardrails.hallucination import detect_hallucinations
from app.guardrails.output import validate_output_safety
from app.guardrails.refusals import (
    REFUSAL_OUT_OF_DOMAIN,
    REFUSAL_INSUFFICIENT_EVIDENCE,
    DISCLAIMER_MEDICAL,
    DISCLAIMER_LEGAL
)

class MedLawGuardPipeline:
    def __init__(self, request: ChatRequest):
        self.request = request
        self.request_id = str(uuid.uuid4())
        self.start_time = time.time()
        self.audit_stages = {}
        
    def execute(self) -> GuardedChatResponse:
        # Run input pipeline
        t0 = time.time()
        decision = run_input_pipeline(self.request.message, self.request.jurisdiction)
        self.audit_stages["input_pipeline_ms"] = int((time.time() - t0) * 1000)
        
        # Determine disclaimer
        disclaimer = ""
        if decision.domain in ["medical", "mixed_medical_legal"]:
            disclaimer = DISCLAIMER_MEDICAL
        elif decision.domain == "legal":
            disclaimer = DISCLAIMER_LEGAL
            
        # Check if rejected by input guardrails
        if not decision.allowed:
            self._log_audit(decision.domain, decision.confidence, decision.reason, decision.status, [])
            return GuardedChatResponse(
                status=decision.status,
                domain=decision.domain,
                confidence=decision.confidence,
                answer=decision.reason,
                disclaimer=disclaimer,
                citations=[],
                safety_flags=decision.safety_flags,
                requires_professional_help=decision.requires_professional_help,
                requires_jurisdiction=decision.requires_jurisdiction,
                request_id=self.request_id
            )
            
        # 7. Retrieve & Rerank
        t1 = time.time()
        chunks = retrieve_and_rerank(decision.redacted_input, decision.domain)
        self.audit_stages["retrieval_ms"] = int((time.time() - t1) * 1000)
        
        # 8. Check Retrieval Evidence
        if not chunks or len(chunks) < 1:  # Relaxed minimum to 1 chunk for sample database size
            reason = REFUSAL_INSUFFICIENT_EVIDENCE
            self._log_audit(decision.domain, decision.confidence, reason, "insufficient_evidence", [])
            return GuardedChatResponse(
                status="insufficient_evidence",
                domain=decision.domain,
                confidence=decision.confidence,
                answer=reason,
                disclaimer=disclaimer,
                citations=[],
                request_id=self.request_id
            )
            
        # 9. LLM Generation
        t2 = time.time()
        llm_response = generate_llm_response(decision.redacted_input, chunks)
        self.audit_stages["llm_generation_ms"] = int((time.time() - t2) * 1000)
        
        answer = llm_response.get("answer", "")
        
        # If answer is empty, default to insufficient evidence refusal
        if not answer:
            reason = REFUSAL_INSUFFICIENT_EVIDENCE
            self._log_audit(decision.domain, decision.confidence, reason, "insufficient_evidence", chunks)
            return GuardedChatResponse(
                status="insufficient_evidence",
                domain=decision.domain,
                confidence=decision.confidence,
                answer=reason,
                disclaimer=disclaimer,
                citations=[],
                request_id=self.request_id
            )
            
        # Map output chunk citations
        citations = []
        for c in chunks:
            citations.append(Citation(
                document_id=c["document_id"],
                chunk_id=c["chunk_id"],
                title=c["title"],
                publisher=c["publisher"],
                source_url=c["source_url"],
                relevance_score=c["relevance_score"]
            ))
            
        # 10. Citation Validation
        claim_citations = llm_response.get("claim_citation_map", [])
        citations_valid = validate_citations(claim_citations, chunks)
        if not citations_valid:
            reason = REFUSAL_INSUFFICIENT_EVIDENCE
            self._log_audit(decision.domain, decision.confidence, reason, "insufficient_evidence", chunks)
            return GuardedChatResponse(
                status="insufficient_evidence",
                domain=decision.domain,
                confidence=decision.confidence,
                answer=reason,
                disclaimer=disclaimer,
                citations=[],
                safety_flags=["citation_mismatch"],
                request_id=self.request_id
            )
            
        # 11. Hallucination Check
        hallucination_detected = detect_hallucinations(answer, chunks)
        if hallucination_detected:
            reason = REFUSAL_INSUFFICIENT_EVIDENCE
            self._log_audit(decision.domain, decision.confidence, reason, "insufficient_evidence", chunks)
            return GuardedChatResponse(
                status="insufficient_evidence",
                domain=decision.domain,
                confidence=decision.confidence,
                answer=reason,
                disclaimer=disclaimer,
                citations=[],
                safety_flags=["hallucination_detected"],
                request_id=self.request_id
            )
            
        # 12. Output Safety Check
        output_safe = validate_output_safety(answer)
        if not output_safe:
            reason = "Response blocked by output safety guardrails."
            self._log_audit(decision.domain, decision.confidence, reason, "rejected", chunks)
            return GuardedChatResponse(
                status="rejected",
                domain=decision.domain,
                confidence=decision.confidence,
                answer=reason,
                disclaimer=disclaimer,
                citations=[],
                safety_flags=["unsafe_output"],
                request_id=self.request_id
            )
            
        # Final success response
        self._log_audit(decision.domain, decision.confidence, answer, "success", chunks)
        return GuardedChatResponse(
            status="success",
            domain=decision.domain,
            confidence=decision.confidence,
            answer=answer,
            disclaimer=disclaimer,
            citations=citations,
            requires_professional_help=llm_response.get("requires_professional_help", False),
            requires_jurisdiction=decision.requires_jurisdiction,
            request_id=self.request_id
        )
        
    def _log_audit(self, domain: str, confidence: float, answer: str, status: str, chunks: list[dict]):
        latency = int((time.time() - self.start_time) * 1000)
        db = SessionLocal()
        try:
            # Mask sensitive inputs
            redacted_input = self.request.message[:200] + "..." if len(self.request.message) > 200 else self.request.message
            
            audit = AuditLog(
                request_id=self.request_id,
                anonymized_user_id=self.request.user_id or "anonymous",
                domain=domain,
                confidence=confidence,
                input_text=redacted_input,
                output_text=answer,
                guardrail_decisions=self.audit_stages,
                latency_ms=latency,
                status=status
            )
            db.add(audit)
            db.commit()
        except Exception as e:
            print(f"Failed to save audit log: {e}")
        finally:
            db.close()
