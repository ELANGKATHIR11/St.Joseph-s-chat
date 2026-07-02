import time
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.postgres import get_db, init_db
from app.db.models import AuditLog, Feedback, SafeMemory
from app.schemas.chat import ChatRequest, GuardedChatResponse, FeedbackCreate
from app.graph.medlaw_guard_graph import MedLawGuardPipeline

app = FastAPI(title="MedLaw Guard API", version="1.0.0")

# Allow CORS for React development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Automatically initialize SQLite / PostgreSQL tables
    init_db()

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "model": settings.OLLAMA_MODEL}

@app.post("/api/chat", response_model=GuardedChatResponse)
def chat_endpoint(request: ChatRequest):
    pipeline = MedLawGuardPipeline(request)
    response = pipeline.execute()
    return response

@app.post("/api/feedback")
def submit_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    try:
        new_feedback = Feedback(
            request_id=feedback.request_id,
            rating=feedback.rating,
            comments=feedback.comments
        )
        db.add(new_feedback)
        db.commit()
        return {"status": "success", "message": "Feedback submitted."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {e}"
        )

@app.get("/api/admin/logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    # Calculate simple stats
    total = db.query(AuditLog).count()
    rejected = db.query(AuditLog).filter(AuditLog.status == "rejected").count()
    emergencies = db.query(AuditLog).filter(AuditLog.status == "emergency").count()
    insufficient = db.query(AuditLog).filter(AuditLog.status == "insufficient_evidence").count()
    success = db.query(AuditLog).filter(AuditLog.status == "success").count()
    
    return {
        "logs": logs,
        "stats": {
            "total": total,
            "success": success,
            "rejected": rejected,
            "emergencies": emergencies,
            "insufficient": insufficient
        }
    }
