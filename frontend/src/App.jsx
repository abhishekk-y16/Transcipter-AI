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
      <div style={{ width: '100vw', height: 'auto', margin: 0, padding: 0, overflow: 'visible' }}>
        {/* Main Content - Full width and height for fullscreen sequences */}
        <main style={{ width: '100%', height: 'auto', margin: 0, padding: 0, overflow: 'visible' }}>
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
