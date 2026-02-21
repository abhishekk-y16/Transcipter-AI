"""
Analytics API endpoints
Provides insights, statistics, and visualizations
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List
from collections import Counter
import logging

from app.core.database import get_collection
from app.models.schemas import AnalyticsResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/{session_id}", response_model=AnalyticsResponse)
async def get_analytics(session_id: str):
    """
    Get comprehensive analytics for a session
    - Speaker statistics
    - Emotion distribution
    - Conversation intensity
    - Top keywords
    """
    try:
        collection = get_collection("transcriptions")
        session = await collection.find_one({"session_id": session_id})
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        segments = session.get('segments', [])
        
        # Calculate speaker stats
        speaker_stats = _calculate_speaker_stats(segments)
        
        # Emotion timeline
        emotion_timeline = _build_emotion_timeline(segments)
        
        # Top keywords
        top_keywords = _extract_top_keywords(segments)
        
        # Conversation intensity (words per minute over time)
        intensity = _calculate_intensity(segments)
        
        return {
            "session_id": session_id,
            "total_duration": session.get('duration', 0),
            "speaker_stats": speaker_stats,
            "emotion_timeline": emotion_timeline,
            "top_keywords": top_keywords,
            "conversation_intensity": intensity
        }
        
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def _calculate_speaker_stats(segments: List[Dict]) -> List[Dict]:
    """Calculate speaking time and emotion distribution per speaker"""
    speaker_data = {}
    
    for seg in segments:
        speaker = seg.get('speaker', 'Unknown')
        duration = seg['end_time'] - seg['start_time']
        emotion = seg.get('emotion', 'neutral')
        
        if speaker not in speaker_data:
            speaker_data[speaker] = {
                "speaker_id": speaker,
                "total_duration": 0,
                "segment_count": 0,
                "emotion_distribution": Counter()
            }
        
        speaker_data[speaker]['total_duration'] += duration
        speaker_data[speaker]['segment_count'] += 1
        speaker_data[speaker]['emotion_distribution'][emotion] += 1
    
    # Convert to list format
    return [
        {
            "speaker_id": data['speaker_id'],
            "total_duration": data['total_duration'],
            "segment_count": data['segment_count'],
            "emotion_distribution": dict(data['emotion_distribution'])
        }
        for data in speaker_data.values()
    ]

def _build_emotion_timeline(segments: List[Dict]) -> List[Dict]:
    """Build timeline of emotions throughout conversation"""
    return [
        {
            "timestamp": seg['start_time'],
            "emotion": seg.get('emotion', 'neutral'),
            "speaker": seg.get('speaker', 'Unknown')
        }
        for seg in segments
    ]

def _extract_top_keywords(segments: List[Dict], limit: int = 10) -> List[str]:
    """Extract most frequent meaningful words"""
    # Combine all text
    all_text = ' '.join([seg['text'] for seg in segments]).lower()
    
    # Simple word frequency (exclude common words)
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'was', 'are', 'were'}
    words = [w for w in all_text.split() if w not in stop_words and len(w) > 3]
    
    word_counts = Counter(words)
    return [word for word, _ in word_counts.most_common(limit)]

def _calculate_intensity(segments: List[Dict]) -> List[Dict]:
    """Calculate conversation intensity (words per minute) over time"""
    if not segments:
        return []
    
    # Group segments into 30-second windows
    window_size = 30
    max_time = segments[-1]['end_time']
    intensity_data = []
    
    for window_start in range(0, int(max_time), window_size):
        window_end = window_start + window_size
        
        # Count words in this window
        words_in_window = sum(
            len(seg['text'].split())
            for seg in segments
            if seg['start_time'] >= window_start and seg['start_time'] < window_end
        )
        
        # Words per minute
        wpm = (words_in_window / window_size) * 60
        
        intensity_data.append({
            "timestamp": window_start,
            "intensity": wpm
        })
    
    return intensity_data
