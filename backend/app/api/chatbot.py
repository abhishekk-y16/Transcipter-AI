"""
Chatbot API endpoints
Allows users to ask questions about transcripts
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatMessage, ChatResponse
from app.services.chatbot_service import get_chatbot_service
from app.core.database import get_collection
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
async def ask_question(message: ChatMessage):
    """
    Ask a question about a transcript
    Examples:
    - "What was decided?"
    - "Who spoke the most?"
    - "Summarize Speaker 2's points"
    """
    try:
        # Get session transcript
        collection = get_collection("transcriptions")
        session = await collection.find_one({"session_id": message.session_id})
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Build full transcript
        transcript = "\n".join([
            f"{seg['speaker']} ({seg['start_time']:.1f}s): {seg['text']}"
            for seg in session['segments']
        ])
        
        # Get answer from chatbot
        chatbot = get_chatbot_service()
        result = chatbot.answer_question(
            message.question,
            transcript,
            session['segments']
        )
        
        return {
            "answer": result['answer'],
            "relevant_segments": result['relevant_segments']
        }
        
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
