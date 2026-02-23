"""
AI chatbot for transcript Q&A
Allows users to ask questions about the conversation
"""
from groq import Groq
from typing import List, Dict
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        """Initialize Groq API client for chatbot"""
        if settings.GROQ_API_KEY:
            try:
                self.client = Groq(api_key=settings.GROQ_API_KEY)
                logger.info("✅ Groq API client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {str(e)}")
                self.client = None
        else:
            logger.warning("⚠️ GROQ_API_KEY not found in environment variables")
            self.client = None
    
    def answer_question(self, question: str, transcript: str, segments: List[Dict]) -> Dict:
        """
        Answer questions about the transcript using context
        
        Returns:
            Dict with answer and relevant segments
        """
        if not self.client:
            return {
                "answer": "Chatbot requires Groq API key. Please configure GROQ_API_KEY in your .env file.",
                "relevant_segments": []
            }
        
        try:
            # Build context from transcript
            context = f"Transcript:\n{transcript}\n\nQuestion: {question}"
            
            logger.info(f"🤖 Calling Groq API with model: llama-3.3-70b-versatile")
            
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are an AI assistant that answers questions about meeting transcripts. Be concise and accurate."},
                    {"role": "user", "content": context}
                ],
                temperature=0.5,
                max_tokens=300
            )
            
            answer = response.choices[0].message.content
            logger.info(f"✅ Groq API response received successfully")
            
            # Find relevant segments (simple keyword matching)
            relevant = self._find_relevant_segments(question, segments)
            
            return {
                "answer": answer,
                "relevant_segments": relevant
            }
            
        except Exception as e:
            logger.error(f"Chatbot error: {str(e)}")
            return {
                "answer": f"Error processing question: {str(e)}",
                "relevant_segments": []
            }
    
    def _find_relevant_segments(self, question: str, segments: List[Dict], limit: int = 3) -> List[Dict]:
        """Find segments most relevant to the question"""
        question_words = set(question.lower().split())
        
        scored_segments = []
        for seg in segments:
            seg_words = set(seg['text'].lower().split())
            overlap = len(question_words & seg_words)
            if overlap > 0:
                scored_segments.append((overlap, seg))
        
        # Sort by relevance and return top segments
        scored_segments.sort(reverse=True, key=lambda x: x[0])
        return [seg for _, seg in scored_segments[:limit]]

# Singleton instance
_chatbot_service = None

def get_chatbot_service() -> ChatbotService:
    """Get or create chatbot service instance"""
    global _chatbot_service
    if _chatbot_service is None:
        logger.info("🔧 Creating new ChatbotService instance...")
        _chatbot_service = ChatbotService()
    return _chatbot_service

def reset_chatbot_service():
    """Force reset chatbot service (useful for testing)"""
    global _chatbot_service
    _chatbot_service = None
    logger.info("🔄 ChatbotService instance reset")
    if _chatbot_service is None:
        _chatbot_service = ChatbotService()
    return _chatbot_service
