"""
Speaker diarization service using Pyannote
Identifies and separates different speakers in audio
"""
import logging
import os
from typing import List, Dict

# Ensure huggingface_hub exposes is_offline_mode for older pyannote imports.
try:
    import huggingface_hub
    from huggingface_hub.utils import is_offline_mode as _is_offline_mode

    if not hasattr(huggingface_hub, "is_offline_mode"):
        huggingface_hub.is_offline_mode = _is_offline_mode
except Exception:
    pass

logger = logging.getLogger(__name__)

class DiarizationService:
    def __init__(self, hf_token: str = None):
        """
        Initialize Pyannote diarization pipeline
        Requires HuggingFace token for model access
        """
        self.pipeline = None
        self.hf_token = hf_token
        logger.info("Diarization service initialized")
    
    def _load_pipeline(self):
        """Lazy load the diarization pipeline"""
        if self.pipeline is not None:
            return self.pipeline
        
        if not self.hf_token:
            logger.warning("No HuggingFace token provided - diarization disabled")
            return None
        
        try:
            # Work around hub API changes by exposing is_offline_mode on the root module
            import huggingface_hub
            try:
                from huggingface_hub.utils import is_offline_mode as _is_offline_mode
                if not hasattr(huggingface_hub, "is_offline_mode"):
                    huggingface_hub.is_offline_mode = _is_offline_mode
            except Exception:
                pass

            from pyannote.audio import Pipeline
            
            logger.info("Loading Pyannote speaker diarization pipeline...")
            if self.hf_token:
                # Support both legacy and current env var names used by HF hub
                os.environ.setdefault("HF_TOKEN", self.hf_token)
                os.environ.setdefault("HUGGINGFACE_HUB_TOKEN", self.hf_token)

            self.pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1"
            )
            logger.info("✅ Diarization pipeline loaded successfully")
            return self.pipeline
        except Exception as e:
            logger.error(f"Failed to load diarization pipeline: {str(e)}")
            logger.warning("Make sure you've accepted the terms at: https://huggingface.co/pyannote/speaker-diarization-3.1")
            return None
    
    def identify_speakers(self, audio_path: str, num_speakers: int = None, min_speakers: int = 1, max_speakers: int = 10) -> List[Dict]:
        """
        Identify speakers in audio file using Pyannote
        
        Args:
            audio_path: Path to audio file
            num_speakers: Exact number of speakers (optional)
            min_speakers: Minimum number of speakers
            max_speakers: Maximum number of speakers
        
        Returns:
            List of speaker segments with timestamps
        """
        try:
            pipeline = self._load_pipeline()
            
            if not pipeline:
                logger.warning("Diarization pipeline not available - returning single speaker")
                return [{"speaker": "Speaker 1", "start": 0.0, "end": 999999.0}]
            
            logger.info(f"Identifying speakers in: {audio_path}")
            
            # Run diarization
            if num_speakers:
                diarization = pipeline(audio_path, num_speakers=num_speakers)
            else:
                diarization = pipeline(audio_path, min_speakers=min_speakers, max_speakers=max_speakers)
            
            # Convert to list of segments
            speaker_segments = []
            speaker_mapping = {}  # Map SPEAKER_XX to Speaker N
            speaker_counter = 1
            
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                # Create friendly speaker names
                if speaker not in speaker_mapping:
                    speaker_mapping[speaker] = f"Speaker {speaker_counter}"
                    speaker_counter += 1
                
                speaker_segments.append({
                    "speaker": speaker_mapping[speaker],
                    "start": turn.start,
                    "end": turn.end
                })
            
            unique_speakers = len(speaker_mapping)
            logger.info(f"✅ Found {unique_speakers} unique speaker(s) in {len(speaker_segments)} segments")
            return speaker_segments
            
        except Exception as e:
            logger.error(f"Diarization error: {str(e)}")
            # Fallback to single speaker
            return [{"speaker": "Speaker 1", "start": 0.0, "end": 999999.0}]

# Singleton instance
_diarization_service = None

def get_diarization_service(hf_token: str = None) -> DiarizationService:
    """Get or create diarization service instance"""
    global _diarization_service
    if _diarization_service is None:
        from app.core.config import settings
        token = hf_token or settings.HF_TOKEN
        _diarization_service = DiarizationService(token)
    return _diarization_service