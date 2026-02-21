# System Flow Diagrams

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                      (React + TailwindCSS)                      │
├─────────────────────────────────────────────────────────────────┤
│  Home Page  │  Transcription  │  Analytics  │  Sessions  │     │
│  (Upload)   │    (View)       │  (Charts)   │  (History) │     │
└──────┬──────────────┬─────────────┬──────────────┬─────────────┘
       │              │             │              │
       │ HTTP/WS      │ REST API    │ REST API     │ REST API
       ▼              ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Transcription│  │  Analytics   │  │   Chatbot    │        │
│  │   Endpoints  │  │  Endpoints   │  │  Endpoints   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │              SERVICE LAYER                          │      │
│  ├─────────────────────────────────────────────────────┤      │
│  │  Transcription │ Diarization │ Emotion │ Summary   │      │
│  │    Service     │   Service   │ Service │  Service  │      │
│  └────────┬───────────────┬──────────┬──────────┬─────┘      │
│           │               │          │          │             │
└───────────┼───────────────┼──────────┼──────────┼─────────────┘
            │               │          │          │
            ▼               ▼          ▼          ▼
    ┌───────────┐   ┌──────────┐  ┌─────────┐  ┌──────────┐
    │  Whisper  │   │ Pyannote │  │wav2vec2 │  │ GPT-3.5  │
    │    AI     │   │  Audio   │  │Emotion  │  │  OpenAI  │
    └───────────┘   └──────────┘  └─────────┘  └──────────┘
            │               │          │          │
            └───────────────┴──────────┴──────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   MongoDB     │
                    │   Database    │
                    └───────────────┘
```

## Audio Processing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    AUDIO INPUT                              │
│              (MP3, WAV, M4A, FLAC)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 STEP 1: TRANSCRIPTION                       │
│                    (Whisper AI)                             │
├─────────────────────────────────────────────────────────────┤
│  Input:  Audio waveform                                     │
│  Output: Text + Word timestamps + Language                  │
│  Time:   ~1x real-time (base model)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 2: SPEAKER DIARIZATION                    │
│                   (Pyannote Audio)                          │
├─────────────────────────────────────────────────────────────┤
│  Input:  Audio waveform                                     │
│  Output: Speaker labels + Time ranges                       │
│  Time:   ~0.5x real-time                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 3: EMOTION DETECTION                      │
│                  (wav2vec2 Model)                           │
├─────────────────────────────────────────────────────────────┤
│  Input:  Audio segments                                     │
│  Output: Emotion labels (happy, sad, angry, etc.)          │
│  Time:   ~0.2x real-time                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                STEP 4: MERGE RESULTS                        │
│                  (Data Processing)                          │
├─────────────────────────────────────────────────────────────┤
│  Combine: Transcript + Speakers + Emotions                  │
│  Create:  Unified segment structure                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            STEP 5: AI SUMMARY GENERATION                    │
│                    (GPT-3.5)                                │
├─────────────────────────────────────────────────────────────┤
│  Input:  Full transcript                                    │
│  Output: Summary + Key points + Action items                │
│  Time:   ~5-10 seconds                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│             STEP 6: KEYWORD EXTRACTION                      │
│                  (NLP Processing)                           │
├─────────────────────────────────────────────────────────────┤
│  Input:  Transcript text                                    │
│  Output: Important keywords + Categories                    │
│  Time:   <1 second                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                STEP 7: SAVE TO DATABASE                     │
│                     (MongoDB)                               │
├─────────────────────────────────────────────────────────────┤
│  Store: Complete session with all metadata                  │
│  Index: For fast searching and retrieval                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 8: RETURN TO FRONTEND                     │
│                   (JSON Response)                           │
├─────────────────────────────────────────────────────────────┤
│  Display: Transcript, summary, analytics, chatbot          │
└─────────────────────────────────────────────────────────────┘
```

## Real-Time Streaming Flow

```
┌──────────────┐                                    ┌──────────────┐
│   Browser    │                                    │   Backend    │
│  Microphone  │                                    │   FastAPI    │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ 1. Establish WebSocket Connection                │
       ├──────────────────────────────────────────────────►
       │                                                   │
       │ 2. Start Recording                                │
       │    (Capture audio chunks)                         │
       │                                                   │
       │ 3. Send Audio Chunk (every 1-2 seconds)          │
       ├──────────────────────────────────────────────────►
       │                                                   │
       │                                    4. Process Chunk
       │                                       (Whisper AI)
       │                                                   │
       │ 5. Receive Transcription                         │
       ◄──────────────────────────────────────────────────┤
       │    {"text": "Hello world", "timestamp": ...}     │
       │                                                   │
       │ 6. Display Text in Real-Time                     │
       │    (Update UI immediately)                        │
       │                                                   │
       │ 7. Send Next Chunk                               │
       ├──────────────────────────────────────────────────►
       │                                                   │
       │ ... (repeat steps 3-7) ...                       │
       │                                                   │
       │ 8. Stop Recording                                │
       ├──────────────────────────────────────────────────►
       │                                                   │
       │ 9. Close WebSocket                               │
       ├──────────────────────────────────────────────────►
       │                                                   │
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER ACTIONS                           │
└─────────────────────────────────────────────────────────────┘
       │                    │                    │
       │ Upload             │ View               │ Ask
       │ Audio              │ Session            │ Question
       ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Upload     │    │   Retrieve   │    │   Chatbot    │
│   Endpoint   │    │   Endpoint   │    │   Endpoint   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                    │                    │
       │ Process            │ Query              │ Query +
       │ Audio              │ Database           │ Context
       ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  AI Pipeline │    │   MongoDB    │    │   GPT-3.5    │
│  (4 models)  │    │   Query      │    │   API Call   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                    │                    │
       │ Save               │ Return             │ Return
       │ Results            │ Data               │ Answer
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                    MongoDB Database                   │
│  Collections: transcriptions, sessions, analytics    │
└──────────────────────────────────────────────────────┘
       │                    │                    │
       │ Fetch              │ Fetch              │ Fetch
       │ Transcript         │ Analytics          │ History
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                   Frontend Display                    │
│  Pages: Transcription, Analytics, Sessions, Chat     │
└──────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Home   │  │Transcript│  │Analytics │  │ Sessions │  │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │              │         │
│       └─────────────┴──────────────┴──────────────┘         │
│                          │                                   │
│                    ┌─────▼─────┐                           │
│                    │   Axios   │                           │
│                    │  (HTTP)   │                           │
│                    └─────┬─────┘                           │
└──────────────────────────┼─────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Network   │
                    └──────┬──────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                    ┌─────▼─────┐                           │
│                    │  FastAPI  │                           │
│                    │  Router   │                           │
│                    └─────┬─────┘                           │
│                          │                                  │
│       ┌──────────────────┼──────────────────┐             │
│       │                  │                  │             │
│  ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐       │
│  │Transcript│      │ Analytics │     │  Chatbot  │       │
│  │   API   │      │    API    │     │    API    │       │
│  └────┬────┘      └─────┬─────┘     └─────┬─────┘       │
│       │                  │                  │             │
│       └──────────────────┼──────────────────┘             │
│                          │                                 │
│                    ┌─────▼─────┐                          │
│                    │  Service  │                          │
│                    │   Layer   │                          │
│                    └─────┬─────┘                          │
│                          │                                 │
│       ┌──────────────────┼──────────────────┐            │
│       │                  │                  │            │
│  ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐      │
│  │ Whisper │      │ Pyannote  │     │  GPT-3.5  │      │
│  │   AI    │      │   Audio   │     │  OpenAI   │      │
│  └─────────┘      └───────────┘     └───────────┘      │
│                                                          │
│                    BACKEND LAYER                         │
└──────────────────────────┬───────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   MongoDB   │
                    │   Database  │
                    └─────────────┘
```

## Error Handling Flow

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Frontend        │
│ Validation      │
└──────┬──────────┘
       │ Valid?
       ├─── No ──► Show Error Message
       │
       ▼ Yes
┌─────────────────┐
│ Send to Backend │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Backend         │
│ Validation      │
└──────┬──────────┘
       │ Valid?
       ├─── No ──► Return 400 Error
       │
       ▼ Yes
┌─────────────────┐
│ Process Request │
└──────┬──────────┘
       │ Success?
       ├─── No ──► Return 500 Error
       │
       ▼ Yes
┌─────────────────┐
│ Return Response │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Frontend        │
│ Display Result  │
└─────────────────┘
```

## Database Schema

```
MongoDB Database: transcription_db

Collection: transcriptions
┌─────────────────────────────────────────────────────┐
│ Document Structure                                  │
├─────────────────────────────────────────────────────┤
│ {                                                   │
│   _id: ObjectId,                                    │
│   session_id: String (UUID),                        │
│   segments: [                                       │
│     {                                               │
│       text: String,                                 │
│       start_time: Float,                            │
│       end_time: Float,                              │
│       speaker: String,                              │
│       emotion: String,                              │
│       confidence: Float                             │
│     }                                               │
│   ],                                                │
│   speakers: [                                       │
│     {                                               │
│       speaker_id: String,                           │
│       total_duration: Float,                        │
│       segment_count: Integer,                       │
│       emotion_distribution: Object                  │
│     }                                               │
│   ],                                                │
│   keywords: Array,                                  │
│   summary: String,                                  │
│   action_items: Array,                              │
│   language: String,                                 │
│   duration: Float,                                  │
│   created_at: DateTime                              │
│ }                                                   │
└─────────────────────────────────────────────────────┘

Indexes:
- session_id (unique)
- created_at (descending)
- language
- Full-text search on segments.text
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION SETUP                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Users     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Load Balancer  │
│   (Nginx/ALB)   │
└──────┬──────────┘
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Frontend    │  │  Frontend    │  │  Frontend    │
│  Instance 1  │  │  Instance 2  │  │  Instance 3  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  API Gateway    │
                 └────────┬─────────┘
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Backend     │  │  Backend     │  │  Backend     │
│  Instance 1  │  │  Instance 2  │  │  Instance 3  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │    Redis     │  │   S3/Blob    │
│   Cluster    │  │    Cache     │  │   Storage    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

These diagrams provide a visual understanding of how the system works at different levels!
