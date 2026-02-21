"""
Core transcription service using Whisper
Handles audio processing and speech-to-text conversion
"""
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class TranscriptionService:
    def __init__(self, model_size: str = "base"):
        """
        Initialize Whisper model
        Models: tiny, base, small, medium, large
        Larger = more accurate but slower
        
        Note: Whisper will be installed on first use
        """
        logger.info(f"Transcription service initialized (model: {model_size})")
        self.model_size = model_size
        self.model = None
    
    def transcribe_audio(
        self,
        audio_path: str,
        language: str = None,
        task: str = "transcribe"
    ) -> Dict:
        """
        Transcribe audio file to text with timestamps
        
        Args:
            audio_path: Path to audio file
            language: Language code (auto-detect if None)
            task: 'transcribe' or 'translate' (to English)
        
        Returns:
            Dict with segments, text, and language
        """
        try:
            logger.info(f"Transcribing audio: {audio_path}")
            
            # Mock transcription for demo
            return {
                "text": "This is a demo transcription. Install openai-whisper for real transcription.",
                "segments": [
                    {
                        "id": 0,
                        "seek": 0,
                        "start": 0.0,
                        "end": 5.0,
                        "text": "This is a demo transcription.",
                        "tokens": [],
                        "temperature": 0.0,
                        "avg_logprob": -0.5,
                        "compression_ratio": 1.5,
                        "no_speech_prob": 0.001
                    }
                ],
                "language": language or "en"
            }
            
        except Exception as e:
            logger.error(f"Transcription error: {str(e)}")
            raise
    
    def transcribe_stream(self, audio_chunk: bytes) -> str:
        """
        Transcribe audio chunk for real-time streaming
        Used for live microphone input
        """
        try:
            # Mock streaming transcription
            return "Demo transcription"
            
        except Exception as e:
            logger.error(f"Stream transcription error: {str(e)}")
            return ""

# Singleton instance
_transcription_service = None

def get_transcription_service(model_size: str = "base") -> TranscriptionService:
    """Get or create transcription service instance"""
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = TranscriptionService(model_size)
    return _transcription_service
