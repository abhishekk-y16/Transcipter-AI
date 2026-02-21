# Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Python version (need 3.11+)
python --version

# Check Node version (need 20+)
node --version

# Check MongoDB (need 7.0+)
mongod --version
```

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd ai-transcription-intelligence
```

### 2. Backend Setup (2 minutes)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-key-here
```

### 3. Start MongoDB (1 minute)

```bash
# Windows: Start MongoDB service
net start MongoDB

# Or run manually
mongod --dbpath data\db
```

### 4. Start Backend (30 seconds)

```bash
# From backend directory
python main.py
```

Backend running at: http://localhost:8000

### 5. Frontend Setup (1 minute)

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install
```

### 6. Start Frontend (30 seconds)

```bash
npm run dev
```

Frontend running at: http://localhost:3000

## First Test

1. Open http://localhost:3000
2. Download a sample audio: [Sample Meeting Audio](https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3)
3. Drag and drop the file
4. Wait for processing (first run downloads models ~1-2GB)
5. View your transcription!

## Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### "MongoDB connection failed"
```bash
# Make sure MongoDB is running
mongod --dbpath data\db
```

### "Port already in use"
```bash
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### "OpenAI API error"
- Check your API key in `backend/.env`
- Verify you have credits: https://platform.openai.com/usage

## Next Steps

- Read [SETUP.md](SETUP.md) for detailed configuration
- Check [FEATURES.md](FEATURES.md) for all features
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Try [DEMO.md](DEMO.md) for presentation guide

## Quick Commands

```bash
# Start everything (Windows)
start.bat

# Backend only
cd backend && python main.py

# Frontend only
cd frontend && npm run dev

# Docker (all services)
docker-compose up -d

# Stop Docker
docker-compose down
```

## API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Sample API Calls

```bash
# Upload audio
curl -X POST "http://localhost:8000/api/transcription/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.mp3"

# Get sessions
curl "http://localhost:8000/api/transcription/sessions"

# Get analytics
curl "http://localhost:8000/api/analytics/{session_id}"
```

## Configuration

### Change Whisper Model

Edit `backend/app/core/config.py`:
```python
WHISPER_MODEL = "base"  # tiny, base, small, medium, large
```

### Change Port

Backend (`backend/main.py`):
```python
uvicorn.run("main:app", port=8000)
```

Frontend (`frontend/vite.config.js`):
```javascript
server: { port: 3000 }
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Slow processing | Use smaller model (tiny/base) |
| Out of memory | Reduce model size or add RAM |
| Poor accuracy | Use larger model (medium/large) |
| No speaker labels | Add HF_TOKEN to .env |
| No summary | Add OPENAI_API_KEY to .env |

## Getting Help

1. Check logs in `backend/logs/`
2. Review API docs at `/docs`
3. Check browser console (F12)
4. Read error messages carefully
5. Search issues on GitHub

## Development Mode

```bash
# Backend with auto-reload
cd backend
python main.py  # Already has reload enabled

# Frontend with hot reload
cd frontend
npm run dev  # Already has HMR enabled
```

## Production Build

```bash
# Frontend production build
cd frontend
npm run build

# Serve production build
npm run preview

# Backend production
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Docker Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## Testing

```bash
# Test backend API
curl http://localhost:8000/

# Test frontend
curl http://localhost:3000/

# Test MongoDB
mongosh
> show dbs
> use transcription_db
> show collections
```

## Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] Can upload audio file
- [ ] Transcription appears
- [ ] Summary generated
- [ ] Analytics visible
- [ ] Export works

## What's Next?

1. **Customize**: Change colors, add logo
2. **Enhance**: Add more features
3. **Deploy**: Push to cloud (AWS, GCP, Azure)
4. **Share**: Demo to friends, add to portfolio
5. **Contribute**: Improve and share back

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [Whisper Docs](https://github.com/openai/whisper)
- [MongoDB Docs](https://docs.mongodb.com/)
- [TailwindCSS Docs](https://tailwindcss.com/)

---

You're all set! Start building amazing transcription experiences! 🚀
