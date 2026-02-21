"""
Core transcription service using Whisper
Handles audio processing and speech-to-text conversion
"""
import logging
from typing import Dict, List

from app.core.config import settings

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

    def _load_model(self):
        if self.model is not None:
            return self.model

        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:
            raise RuntimeError(
                "faster-whisper is not installed. Run: pip install faster-whisper"
            ) from exc

        logger.info(f"Loading Whisper model: {self.model_size}")
        self.model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
        return self.model
    
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
            model = self._load_model()

            segments_iter, info = model.transcribe(
                audio_path,
                language=language,
                task=task
            )

            segments = []
            full_text = []
            for idx, seg in enumerate(segments_iter):
                segments.append({
                    "id": idx,
                    "seek": 0,
                    "start": float(seg.start),
                    "end": float(seg.end),
                    "text": seg.text.strip(),
                    "tokens": [],
                    "temperature": 0.0,
                    "avg_logprob": 0.0,
                    "compression_ratio": 0.0,
                    "no_speech_prob": 0.0
                })
                full_text.append(seg.text.strip())

            return {
                "text": " ".join([t for t in full_text if t]),
                "segments": segments,
                "language": info.language or language or "en"
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
        _transcription_service = TranscriptionService(model_size or settings.WHISPER_MODEL)
    return _transcription_service
