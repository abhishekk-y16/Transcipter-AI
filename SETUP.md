# Setup Guide - AI Transcription Intelligence System

## Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB 7.0+
- FFmpeg (for audio processing)
- 8GB+ RAM recommended
- GPU optional (for faster processing)

## Installation

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd ai-transcription-intelligence

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# MongoDB: localhost:27017
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env and add your API keys:
# - OPENAI_API_KEY (for summary & chatbot)
# - HF_TOKEN (for speaker diarization)

# Start MongoDB
# Make sure MongoDB is running on localhost:27017

# Run the backend
python main.py
```

Backend will be available at `http://localhost:8000`

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Configuration

### API Keys

1. **OpenAI API Key** (Required for AI features)
   - Get from: https://platform.openai.com/api-keys
   - Used for: Summary generation, action items, chatbot
   - Add to `backend/.env`: `OPENAI_API_KEY=sk-...`

2. **HuggingFace Token** (Optional, for speaker diarization)
   - Get from: https://huggingface.co/settings/tokens
   - Accept terms: https://huggingface.co/pyannote/speaker-diarization-3.1
   - Add to `backend/.env`: `HF_TOKEN=hf_...`

### Model Selection

Edit `backend/app/core/config.py`:

```python
WHISPER_MODEL = "base"  # Options: tiny, base, small, medium, large
# tiny: Fastest, least accurate
# base: Good balance (recommended for development)
# small: Better accuracy
# medium: High accuracy
# large: Best accuracy, slowest
```

## First Run

1. Start the backend and frontend
2. Open http://localhost:3000
3. Upload a test audio file (MP3 or WAV)
4. Wait for processing (first run downloads AI models ~1-2GB)
5. View transcription, analytics, and AI insights

## Troubleshooting

### Backend Issues

**Error: "No module named 'whisper'"**
```bash
pip install openai-whisper
```

**Error: "MongoDB connection failed"**
- Ensure MongoDB is running
- Check connection string in `.env`

**Error: "CUDA out of memory"**
- Use smaller Whisper model (tiny or base)
- Or disable GPU: Set `CUDA_VISIBLE_DEVICES=-1`

### Frontend Issues

**Error: "Cannot connect to backend"**
- Ensure backend is running on port 8000
- Check proxy configuration in `vite.config.js`

**Blank page after upload**
- Check browser console for errors
- Verify API responses in Network tab

### Performance Optimization

**For faster transcription:**
- Use GPU if available
- Use smaller Whisper model (base or small)
- Process shorter audio files

**For better accuracy:**
- Use larger Whisper model (medium or large)
- Ensure good audio quality
- Minimize background noise

## Development

### Backend Development

```bash
cd backend

# Run with auto-reload
python main.py

# Run tests (if available)
pytest

# Format code
black .
```

### Frontend Development

```bash
cd frontend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Production Deployment

### Environment Variables

Set these in production:

```bash
ENVIRONMENT=production
SECRET_KEY=<generate-secure-key>
MONGODB_URL=<production-mongodb-url>
OPENAI_API_KEY=<your-key>
HF_TOKEN=<your-token>
```

### Security Checklist

- [ ] Change SECRET_KEY
- [ ] Use HTTPS
- [ ] Enable MongoDB authentication
- [ ] Set up CORS properly
- [ ] Rate limit API endpoints
- [ ] Validate file uploads
- [ ] Sanitize user inputs

### Scaling Considerations

- Use Redis for caching
- Queue system for long-running tasks (Celery)
- CDN for static assets
- Load balancer for multiple backend instances
- Separate database server

## Next Steps

1. Test with various audio files
2. Customize UI theme and branding
3. Add user authentication
4. Implement real-time WebSocket streaming
5. Add more export formats
6. Enhance speaker diarization accuracy
7. Add multi-language translation
8. Implement toxic speech detection

## Support

For issues and questions:
- Check logs in `backend/logs/`
- Review API documentation at `http://localhost:8000/docs`
- Check browser console for frontend errors
