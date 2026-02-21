# System Architecture - AI Transcription Intelligence

## Overview

This system is built as a modern, production-grade application with clear separation of concerns, modular design, and scalable architecture.

## High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Frontend   │ ◄─────► │   Backend   │
│  (React)    │  HTTP   │   (Vite)     │  REST   │  (FastAPI)  │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                         │
                                                         ▼
                        ┌────────────────────────────────────────┐
                        │         AI Processing Pipeline         │
                        ├────────────────────────────────────────┤
                        │  Whisper → Diarization → Emotion →    │
                        │  Summary → Keywords → Analytics        │
                        └────────────────────────────────────────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │   MongoDB   │
                                  │  (Storage)  │
                                  └─────────────┘
```

## Data Flow

### Audio Upload Flow

```
1. User uploads audio file
   ↓
2. Frontend sends multipart/form-data to /api/transcription/upload
   ↓
3. Backend saves file temporarily
   ↓
4. AI Processing Pipeline:
   a. Whisper transcribes audio → text + timestamps
   b. Pyannote identifies speakers → speaker labels
   c. Emotion model analyzes tone → emotion tags
   d. LLM generates summary → key points + action items
   e. Keyword extraction → important terms
   ↓
5. Results saved to MongoDB
   ↓
6. Response sent to frontend with session_id
   ↓
7. Frontend displays transcript with all insights
```

### Real-Time Streaming Flow (WebSocket)

```
1. User clicks "Record"
   ↓
2. Browser captures microphone audio
   ↓
3. Audio chunks sent via WebSocket to /api/transcription/stream
   ↓
4. Backend processes each chunk with Whisper
   ↓
5. Transcription sent back to client in real-time
   ↓
6. Frontend displays text as it's spoken
```

## Backend Architecture

### Directory Structure

```
backend/
├── app/
│   ├── api/              # API endpoints (routes)
│   │   ├── transcription.py   # Upload, streaming, sessions
│   │   ├── analytics.py       # Statistics and insights
│   │   ├── chatbot.py         # Q&A functionality
│   │   └── export.py          # PDF, DOCX, TXT export
│   │
│   ├── services/         # Business logic
│   │   ├── transcription_service.py  # Whisper integration
│   │   ├── emotion_service.py        # Emotion detection
│   │   ├── summary_service.py        # LLM summaries
│   │   └── chatbot_service.py        # AI chatbot
│   │
│   ├── models/           # Data models
│   │   └── schemas.py    # Pydantic models for validation
│   │
│   └── core/             # Core functionality
│       ├── config.py     # Configuration management
│       └── database.py   # MongoDB connection
│
├── main.py               # Application entry point
└── requirements.txt      # Python dependencies
```

### API Endpoints

#### Transcription API
- `POST /api/transcription/upload` - Upload audio file
- `WS /api/transcription/stream` - Real-time streaming
- `GET /api/transcription/sessions` - List all sessions
- `GET /api/transcription/session/{id}` - Get specific session

#### Analytics API
- `GET /api/analytics/{session_id}` - Get comprehensive analytics

#### Chatbot API
- `POST /api/chatbot/ask` - Ask questions about transcript

#### Export API
- `GET /api/export/pdf/{session_id}` - Export as PDF
- `GET /api/export/docx/{session_id}` - Export as DOCX
- `GET /api/export/txt/{session_id}` - Export as TXT

## AI Models & Services

### 1. Speech-to-Text (Whisper)

**Purpose**: Convert audio to text with timestamps

**Model**: OpenAI Whisper
- Sizes: tiny (39M), base (74M), small (244M), medium (769M), large (1550M)
- Supports 99 languages
- Word-level timestamps

**Why Whisper?**
- State-of-the-art accuracy
- Robust to accents and noise
- Multi-language support
- Open source

**Processing**:
```python
audio → Whisper → {
    "text": "full transcript",
    "segments": [
        {"text": "...", "start": 0.0, "end": 2.5},
        ...
    ],
    "language": "en"
}
```

### 2. Speaker Diarization (Pyannote)

**Purpose**: Identify who spoke when

**Model**: Pyannote Speaker Diarization 3.1
- Separates different speakers
- Assigns speaker labels
- Handles overlapping speech

**Why Pyannote?**
- Industry-leading accuracy
- Pre-trained on diverse datasets
- Active development

**Processing**:
```python
audio → Pyannote → [
    {"speaker": "SPEAKER_00", "start": 0.0, "end": 5.2},
    {"speaker": "SPEAKER_01", "start": 5.2, "end": 8.7},
    ...
]
```

### 3. Emotion Detection

**Purpose**: Detect emotions from voice tone

**Model**: wav2vec2-lg-xlsr-en-speech-emotion-recognition
- Detects: happy, sad, angry, neutral, stressed, surprised
- Analyzes prosody and tone
- Works on audio segments

**Why This Model?**
- Fine-tuned for emotion recognition
- Good accuracy on English speech
- Lightweight

**Processing**:
```python
audio_segment → Emotion Model → {
    "emotion": "happy",
    "confidence": 0.87
}
```

### 4. AI Summary & Action Items (LLM)

**Purpose**: Generate intelligent summaries

**Model**: GPT-3.5-turbo (OpenAI)
- Summarizes conversations
- Extracts key points
- Identifies action items
- Assigns priorities

**Why GPT-3.5?**
- Excellent understanding of context
- Structured output
- Cost-effective
- Fast response

**Processing**:
```python
transcript → GPT-3.5 → {
    "summary": "Meeting discussed...",
    "key_points": ["Point 1", "Point 2"],
    "action_items": [
        {"task": "...", "assignee": "...", "priority": "high"}
    ]
}
```

### 5. Chatbot (LLM)

**Purpose**: Answer questions about transcripts

**Model**: GPT-3.5-turbo
- Context-aware responses
- References specific segments
- Natural language understanding

**Processing**:
```python
question + transcript → GPT-3.5 → {
    "answer": "The decision was...",
    "relevant_segments": [...]
}
```

## Frontend Architecture

### Technology Stack

- **React 18**: Component-based UI
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first styling
- **React Router**: Client-side routing
- **Recharts**: Data visualization
- **Axios**: HTTP client

### Component Structure

```
src/
├── pages/
│   ├── HomePage.jsx          # Upload interface
│   ├── TranscriptionPage.jsx # Transcript viewer
│   ├── AnalyticsPage.jsx     # Analytics dashboard
│   └── SessionsPage.jsx      # Session history
│
├── components/               # Reusable components
├── App.jsx                   # Main app component
└── main.jsx                  # Entry point
```

### State Management

- Local component state with `useState`
- API calls with `axios`
- No global state management (can add Redux/Zustand if needed)

### Styling Approach

- Dark theme by default
- Custom CSS classes for consistency
- Responsive design (mobile-friendly)
- Accessible components

## Database Schema

### MongoDB Collections

#### transcriptions
```javascript
{
  _id: "session_id",
  session_id: "uuid",
  segments: [
    {
      text: "Hello world",
      start_time: 0.0,
      end_time: 1.5,
      speaker: "Speaker 1",
      emotion: "happy",
      confidence: 0.95
    }
  ],
  speakers: [
    {
      speaker_id: "Speaker 1",
      total_duration: 45.2,
      segment_count: 12,
      emotion_distribution: {
        "happy": 5,
        "neutral": 7
      }
    }
  ],
  keywords: [
    {word: "important", category: "important"}
  ],
  summary: "Meeting summary...",
  action_items: [
    {task: "...", assignee: "...", priority: "high"}
  ],
  language: "en",
  duration: 120.5,
  created_at: ISODate("2024-01-01T00:00:00Z")
}
```

## Performance Considerations

### Backend Optimization

1. **Model Loading**: Models loaded once at startup (singleton pattern)
2. **Async Processing**: FastAPI async endpoints for non-blocking I/O
3. **Streaming**: WebSocket for real-time transcription
4. **Caching**: Can add Redis for frequently accessed data

### Frontend Optimization

1. **Code Splitting**: React lazy loading for routes
2. **Memoization**: React.memo for expensive components
3. **Debouncing**: For search and filter operations
4. **Lazy Loading**: Images and charts loaded on demand

### Scalability

**Current Limitations**:
- Single-server processing
- Synchronous AI pipeline
- In-memory model storage

**Scaling Solutions**:
1. **Horizontal Scaling**: Multiple backend instances with load balancer
2. **Task Queue**: Celery + Redis for async processing
3. **Microservices**: Separate services for each AI model
4. **Cloud Storage**: S3 for audio files
5. **CDN**: CloudFront for static assets

## Security

### Current Implementation

- CORS middleware for cross-origin requests
- File type validation
- Input sanitization with Pydantic
- MongoDB injection prevention

### Production Recommendations

1. **Authentication**: JWT tokens, OAuth2
2. **Rate Limiting**: Prevent abuse
3. **File Scanning**: Antivirus for uploads
4. **HTTPS**: SSL/TLS encryption
5. **API Keys**: Secure storage (AWS Secrets Manager)
6. **Input Validation**: Strict validation on all inputs

## Monitoring & Logging

### Current Logging

- Python `logging` module
- Console output for development
- Error tracking in try-catch blocks

### Production Monitoring

1. **Application Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
2. **Metrics**: Prometheus + Grafana
3. **Error Tracking**: Sentry
4. **Performance**: New Relic or DataDog
5. **Uptime**: Pingdom or UptimeRobot

## Future Enhancements

### Short-term
- Real-time WebSocket implementation
- User authentication
- Improved speaker diarization
- More export formats

### Long-term
- Multi-language translation
- Video transcription
- Live meeting integration (Zoom, Teams)
- Custom vocabulary training
- Sentiment trend analysis
- Meeting scheduling integration
- Mobile app (React Native)

## Technology Decisions

### Why FastAPI?
- Modern, fast Python framework
- Automatic API documentation
- WebSocket support
- Async/await support
- Type hints and validation

### Why React?
- Component reusability
- Large ecosystem
- Virtual DOM performance
- Strong community support

### Why MongoDB?
- Flexible schema for varying transcript structures
- Good performance for document storage
- Easy to scale horizontally
- JSON-like documents match API responses

### Why Whisper?
- Best-in-class accuracy
- Multi-language support
- Open source
- Active development

## Conclusion

This architecture provides a solid foundation for a production-grade transcription system. It's modular, scalable, and maintainable, with clear separation between frontend, backend, and AI processing layers.
