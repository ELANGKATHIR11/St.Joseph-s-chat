from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import time
from contextlib import asynccontextmanager
from sqlalchemy.future import select

from app.core.config import get_settings
from app.api.api import api_router
from app.db.session import engine, AsyncSessionLocal
from app.models.base import Base
from app.models.user import User
from app.models.chat import Conversation, Message  # Ensure models are loaded

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Ensure dummy user 1 exists for the frontend mockup
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == 1))
        user = result.scalar_one_or_none()
        if not user:
            dummy_user = User(
                id=1,
                email="test@medai.com",
                hashed_password="mockedpassword",
                full_name="Test User"
            )
            session.add(dummy_user)
            await session.commit()
    yield
    # Cleanup on shutdown (if any)
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise-Grade AI Healthcare & Medical Law Assistant API",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup basic loguru logging
logger.add("logs/app.log", rotation="500 MB", retention="10 days", level="INFO")

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"{request.method} {request.url} - {response.status_code} - {process_time:.4f}s")
    return response

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8005, reload=True)
