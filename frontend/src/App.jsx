import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Mic, Upload, BarChart3, MessageSquare, FileText } from 'lucide-react'
import HomePage from './pages/HomePage'
import TranscriptionPage from './pages/TranscriptionPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SessionsPage from './pages/SessionsPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg">
        {/* Navigation */}
        <nav className="bg-dark-card border-b border-dark-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <Mic className="w-8 h-8 text-blue-500" />
                  <span className="text-xl font-bold text-white">AI Transcription</span>
                </Link>
              </div>
              
              <div className="flex space-x-4">
                <Link to="/" className="nav-link">
                  <Upload className="w-5 h-5" />
                  <span>Upload</span>
                </Link>
                <Link to="/sessions" className="nav-link">
                  <FileText className="w-5 h-5" />
                  <span>Sessions</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/transcription/:sessionId" element={<TranscriptionPage />} />
            <Route path="/analytics/:sessionId" element={<AnalyticsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
