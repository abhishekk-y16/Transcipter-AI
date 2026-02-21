@echo off
echo ========================================
echo AI Transcription Intelligence System
echo ========================================
echo.

echo Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath data\db"
timeout /t 3

echo.
echo Starting Backend...
cd backend
start "Backend" cmd /k "python main.py"
cd ..
timeout /t 5

echo.
echo Starting Frontend...
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo All services started!
echo ========================================
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Press any key to exit...
pause >nul
