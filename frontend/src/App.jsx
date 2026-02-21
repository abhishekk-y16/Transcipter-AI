import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Mic, Upload, BarChart3, FileText } from 'lucide-react'
import HomePage from './pages/HomePage'
import TranscriptionPage from './pages/TranscriptionPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SessionsPage from './pages/SessionsPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        {/* Navigation */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-slate-900">Transcriber</span>
                </Link>
              </div>
              
              <div className="flex space-x-1">
                <Link to="/" className="nav-link-light">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </Link>
                <Link to="/sessions" className="nav-link-light">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Sessions</span>
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
