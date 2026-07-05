from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.chat import Conversation, Message
from app.services.chatbot import generate_chat_response
from typing import Optional

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: int
    message: str
    conversation_id: Optional[int] = None

class ChatResponse(BaseModel):
    conversation_id: int
    response: str

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch or create a conversation
    if request.conversation_id:
        result = await db.execute(select(Conversation).where(Conversation.id == request.conversation_id))
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=request.user_id, title="New Chat")
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    # 2. Save user message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    await db.commit()

    # 3. Generate chatbot response using the ML model
    try:
        bot_response_text = generate_chat_response(request.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate response: {str(e)}")

    # 4. Save bot message
    bot_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=bot_response_text
    )
    db.add(bot_message)
    await db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        response=bot_response_text
    )
