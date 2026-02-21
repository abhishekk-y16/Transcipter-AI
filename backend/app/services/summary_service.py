"""
AI-powered summary and action item generation
Uses LLM to analyze transcripts and generate insights
"""
from openai import OpenAI
from typing import List, Dict
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class SummaryService:
    def __init__(self):
        """Initialize OpenAI client"""
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    def generate_summary(self, transcript: str, speakers: List[Dict]) -> Dict:
        """
        Generate meeting summary and action items
        
        Returns:
            Dict with summary, key_points, and action_items
        """
        if not self.client:
            return self._fallback_summary(transcript)
        
        try:
            prompt = f"""Analyze this conversation transcript and provide:

1. A concise summary (2-3 sentences)
2. Key discussion points (bullet points)
3. Action items with assignees if mentioned

Transcript:
{transcript}

Speakers: {', '.join([s['speaker_id'] for s in speakers])}

Format your response as JSON:
{{
  "summary": "...",
  "key_points": ["...", "..."],
  "action_items": [
    {{"task": "...", "assignee": "...", "priority": "high/medium/low"}}
  ]
}}"""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an AI assistant that analyzes meeting transcripts."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"Summary generation error: {str(e)}")
            return self._fallback_summary(transcript)
    
    def _fallback_summary(self, transcript: str) -> Dict:
        """Simple fallback when LLM is unavailable"""
        sentences = transcript.split('.')[:3]
        return {
            "summary": '. '.join(sentences) + '.',
            "key_points": ["Transcript available for review"],
            "action_items": []
        }
    
    def extract_keywords(self, transcript: str) -> List[Dict]:
        """Extract important keywords, names, dates, decisions"""
        keywords = []
        
        # Simple keyword extraction (can be enhanced with NER)
        important_words = ['decided', 'action', 'deadline', 'important', 'critical', 'must', 'will']
        
        for word in important_words:
            if word in transcript.lower():
                keywords.append({
                    "word": word,
                    "category": "important"
                })
        
        return keywords

# Singleton instance
_summary_service = None

def get_summary_service() -> SummaryService:
    """Get or create summary service instance"""
    global _summary_service
    if _summary_service is None:
        _summary_service = SummaryService()
    return _summary_service
