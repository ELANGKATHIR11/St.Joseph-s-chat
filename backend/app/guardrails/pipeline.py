from app.schemas.chat import GuardrailDecision
from app.guardrails.input import sanitize_input
from app.guardrails.injection import detect_injection
from app.guardrails.pii import redact_pii
from app.guardrails.domain import classify_domain
from app.guardrails.medical import check_medical_emergency, check_medical_safety
from app.guardrails.legal import needs_jurisdiction, check_legal_safety
from app.guardrails.refusals import (
    REFUSAL_OUT_OF_DOMAIN,
    REFUSAL_INJECTION,
    EMERGENCY_RESPONSE
)

def run_input_pipeline(user_message: str, user_jurisdiction: str | None = None) -> GuardrailDecision:
    # 1. Sanitize
    sanitized = sanitize_input(user_message)
    
    # 2. Injection check
    is_inj, inj_conf = detect_injection(sanitized)
    if is_inj:
        return GuardrailDecision(
            allowed=False,
            status="rejected",
            reason=REFUSAL_INJECTION,
            domain="out_of_domain",
            confidence=inj_conf,
            safety_flags=["prompt_injection"],
            sanitized_input=sanitized,
            redacted_input=sanitized
        )
        
    # 3. PII Redact
    redacted = redact_pii(sanitized)
    
    # 4. Domain Classification
    domain, domain_conf = classify_domain(redacted)
    if domain == "out_of_domain" or domain_conf < 0.85:  # Strict threshold limit
        return GuardrailDecision(
            allowed=False,
            status="rejected",
            reason=REFUSAL_OUT_OF_DOMAIN,
            domain="out_of_domain",
            confidence=domain_conf,
            sanitized_input=sanitized,
            redacted_input=redacted
        )
        
    # 5. Medical Safety / Emergency Checks
    if domain in ["medical", "mixed_medical_legal"]:
        is_emerg = check_medical_emergency(redacted)
        if is_emerg:
            return GuardrailDecision(
                allowed=False,
                status="emergency",
                reason=EMERGENCY_RESPONSE,
                domain=domain,
                confidence=domain_conf,
                safety_flags=["medical_emergency"],
                sanitized_input=sanitized,
                redacted_input=redacted
            )
            
        med_safe, med_reason = check_medical_safety(redacted)
        if not med_safe:
            return GuardrailDecision(
                allowed=False,
                status="rejected",
                reason=med_reason,
                domain=domain,
                confidence=domain_conf,
                safety_flags=["medical_safety_violation"],
                sanitized_input=sanitized,
                redacted_input=redacted
            )

    # 6. Legal Safety / Jurisdiction Checks
    requires_juris = False
    if domain in ["legal", "mixed_medical_legal"]:
        leg_safe, leg_reason = check_legal_safety(redacted)
        if not leg_safe:
            return GuardrailDecision(
                allowed=False,
                status="rejected",
                reason=leg_reason,
                domain=domain,
                confidence=domain_conf,
                safety_flags=["legal_safety_violation"],
                sanitized_input=sanitized,
                redacted_input=redacted
            )
            
        if needs_jurisdiction(redacted):
            requires_juris = True
            if not user_jurisdiction:
                return GuardrailDecision(
                    allowed=False,
                    status="clarification_required",
                    reason="Jurisdiction is required to answer this legal question. Please provide your country, state, or region.",
                    domain=domain,
                    confidence=domain_conf,
                    requires_jurisdiction=True,
                    sanitized_input=sanitized,
                    redacted_input=redacted
                )
                
    # All input checks passed!
    return GuardrailDecision(
        allowed=True,
        status="allowed",
        reason="All input checks passed.",
        domain=domain,
        confidence=domain_conf,
        requires_jurisdiction=requires_juris,
        sanitized_input=sanitized,
        redacted_input=redacted
    )
