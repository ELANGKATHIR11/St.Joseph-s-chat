from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

# Keep locations and names intact for domain RAG searches (e.g. Punjab, doctor names in Q&A)
PII_ENTITIES = ["PHONE_NUMBER", "EMAIL_ADDRESS", "US_SSN", "CREDIT_CARD", "CRYPTO", "IP_ADDRESS"]

def redact_pii(text: str) -> str:
    if not text:
        return ""
    try:
        # Detect entities
        results = analyzer.analyze(text=text, language="en", entities=PII_ENTITIES)
        # Anonymize
        anonymized_result = anonymizer.anonymize(text=text, analyzer_results=results)
        return anonymized_result.text
    except Exception as e:
        print(f"PII redaction warning: {e}")
        return text
