"""
AI-Powered Real-Time Transcription & Intelligence System
Main FastAPI application entry point
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import transcription, analytics, chatbot, export
from app.core.database import connect_to_mongo, close_mongo_connection

app = FastAPI(
    title="AI Transcription Intelligence System",
    description="Production-grade real-time transcription with AI insights",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database lifecycle
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Health check
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "AI Transcription Intelligence System",
        "version": "1.0.0"
    }

# Include routers
app.include_router(transcription.router, prefix="/api/transcription", tags=["Transcription"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )
