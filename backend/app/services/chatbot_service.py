"""
AI chatbot for transcript Q&A
Allows users to ask questions about the conversation
"""
from openai import OpenAI
from typing import List, Dict
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        """Initialize OpenAI client for chatbot"""
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    def answer_question(self, question: str, transcript: str, segments: List[Dict]) -> Dict:
        """
        Answer questions about the transcript using context
        
        Returns:
            Dict with answer and relevant segments
        """
        if not self.client:
            return {
                "answer": "Chatbot requires OpenAI API key. Please configure OPENAI_API_KEY.",
                "relevant_segments": []
            }
        
        try:
            # Build context from transcript
            context = f"Transcript:\n{transcript}\n\nQuestion: {question}"
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an AI assistant that answers questions about meeting transcripts. Be concise and accurate."},
                    {"role": "user", "content": context}
                ],
                temperature=0.5,
                max_tokens=300
            )
            
            answer = response.choices[0].message.content
            
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
        _chatbot_service = ChatbotService()
    return _chatbot_service
