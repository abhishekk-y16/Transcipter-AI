"""
Transcription API endpoints
Handles audio upload, real-time streaming, and transcription processing
"""
from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import aiofiles
import os
import uuid
from datetime import datetime
import logging

from app.services.transcription_service import get_transcription_service
from app.services.emotion_service import get_emotion_service
from app.services.summary_service import get_summary_service
from app.core.database import get_collection
from app.models.schemas import TranscriptionResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# Temporary storage for uploaded files
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=TranscriptionResponse)
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload audio file and process transcription
    Supports: MP3, WAV, M4A, FLAC
    """
    try:
        # Validate file type
        allowed_types = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/flac']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported audio format")
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, f"{session_id}_{file.filename}")
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        logger.info(f"Processing audio file: {file.filename}")
        
        # Step 1: Transcribe audio
        transcription_service = get_transcription_service()
        transcription_result = transcription_service.transcribe_audio(file_path)
        
        # Step 2: Detect emotions for each segment
        emotion_service = get_emotion_service()
        segments = []
        
        for seg in transcription_result['segments']:
            emotion_data = emotion_service.detect_emotion(
                file_path,
                start_time=seg['start'],
                end_time=seg['end']
            )
            
            segments.append({
                "text": seg['text'],
                "start_time": seg['start'],
                "end_time": seg['end'],
                "speaker": "Speaker 1",  # Will be updated by diarization
                "emotion": emotion_data['emotion'],
                "confidence": seg.get('confidence', 0.9)
            })
        
        # Step 3: Generate summary and action items
        summary_service = get_summary_service()
        full_transcript = transcription_result['text']
        summary_data = summary_service.generate_summary(full_transcript, [{"speaker_id": "Speaker 1"}])
        keywords = summary_service.extract_keywords(full_transcript)
        
        # Step 4: Prepare response
        response_data = {
            "session_id": session_id,
            "segments": segments,
            "speakers": [{
                "speaker_id": "Speaker 1",
                "total_duration": segments[-1]['end_time'] if segments else 0,
                "segment_count": len(segments),
                "emotion_distribution": {}
            }],
            "keywords": keywords,
            "summary": summary_data.get('summary'),
            "action_items": summary_data.get('action_items', []),
            "language": transcription_result['language'],
            "duration": segments[-1]['end_time'] if segments else 0,
            "created_at": datetime.utcnow()
        }
        
        # Step 5: Save to database
        collection = get_collection("transcriptions")
        await collection.insert_one({**response_data, "_id": session_id})
        
        logger.info(f"Transcription complete: {session_id}")
        
        return response_data
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/stream")
async def websocket_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio streaming
    Client sends audio chunks, server responds with transcription
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    transcription_service = get_transcription_service()
    session_id = str(uuid.uuid4())
    
    try:
        while True:
            # Receive audio chunk from client
            audio_data = await websocket.receive_bytes()
            
            # Transcribe chunk
            text = transcription_service.transcribe_stream(audio_data)
            
            if text:
                # Send transcription back to client
                await websocket.send_json({
                    "session_id": session_id,
                    "text": text,
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close()

@router.get("/sessions")
async def list_sessions():
    """Get all transcription sessions"""
    collection = get_collection("transcriptions")
    sessions = await collection.find({}).sort("created_at", -1).limit(50).to_list(50)
    
    return {
        "sessions": [
            {
                "session_id": s["session_id"],
                "created_at": s["created_at"],
                "duration": s["duration"],
                "language": s["language"]
            }
            for s in sessions
        ]
    }

@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get specific transcription session"""
    collection = get_collection("transcriptions")
    session = await collection.find_one({"session_id": session_id})
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session
