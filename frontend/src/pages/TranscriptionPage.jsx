import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart3, Download, MessageSquare, Clock, User } from 'lucide-react'
import api from '../lib/api'

export default function TranscriptionPage() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState(null)
  const [chatError, setChatError] = useState('')
  const [selectedSpeaker, setSelectedSpeaker] = useState('all')

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      setError('')
      const response = await api.get(`/api/transcription/session/${sessionId}`)
      setSession(response.data)
    } catch (error) {
      console.error('Error fetching session:', error)
      const message = error?.response?.data?.detail || 'Failed to load session.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatQuestion.trim()) return

    try {
      setChatError('')
      const response = await api.post('/api/chatbot/ask', {
        session_id: sessionId,
        question: chatQuestion
      })
      setChatAnswer(response.data.answer)
    } catch (error) {
      console.error('Chat error:', error)
      const message = error?.response?.data?.detail || 'Chatbot failed to answer.'
      setChatError(message)
    }
  }

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/api/export/${format}/${sessionId}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `transcript_${sessionId}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Export error:', error)
      const message = error?.response?.data?.detail || 'Export failed.'
      setError(message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-100 text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-100 text-xl">{error || 'Session not found'}</div>
      </div>
    )
  }

  const filteredSegments = selectedSpeaker === 'all'
    ? session.segments
    : session.segments.filter(seg => seg.speaker === selectedSpeaker)

  const speakers = [...new Set(session.segments.map(seg => seg.speaker))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>Transcription</h1>
          <p className="text-slate-300 mt-1" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>
            Session ID: {sessionId} • Duration: {session.duration.toFixed(1)}s • Language: {session.language}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Link
            to={`/analytics/${sessionId}`}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center space-x-2 shadow-lg"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </Link>
          
          <div className="relative group">
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center space-x-2 shadow-lg">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => handleExport('pdf')} className="block w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-100 rounded-t-lg transition-colors">PDF</button>
              <button onClick={() => handleExport('docx')} className="block w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-100 transition-colors">DOCX</button>
              <button onClick={() => handleExport('txt')} className="block w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-100 rounded-b-lg transition-colors">TXT</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Transcript */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          {session.summary && (
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-100 mb-3">Summary</h2>
              <p className="text-slate-200 leading-relaxed">{session.summary}</p>
              
              {session.action_items && session.action_items.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">Action Items</h3>
                  <ul className="space-y-2">
                    {session.action_items.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-400">•</span>
                        <span className="text-slate-200">{item.task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Speaker Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSpeaker('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedSpeaker === 'all' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Speakers
            </button>
            {speakers.map(speaker => (
              <button
                key={speaker}
                onClick={() => setSelectedSpeaker(speaker)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedSpeaker === speaker 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {speaker}
              </button>
            ))}
          </div>

          {/* Transcript Segments */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-semibold text-slate-100">Transcript</h2>
            
            <div className="space-y-3">
              {filteredSegments.map((segment, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 bg-slate-800/50 pl-4 py-3 rounded-r-lg hover:bg-slate-800/70 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-blue-400 font-semibold">{segment.speaker}</span>
                    <span className="text-slate-400 text-sm flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {segment.start_time.toFixed(1)}s
                    </span>
                    {segment.emotion && (
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getEmotionColor(segment.emotion)}`}>
                        {segment.emotion}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 leading-relaxed">{segment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Chatbot */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-100 mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Ask AI
            </h2>
            
            <form onSubmit={handleChatSubmit} className="space-y-3">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                placeholder="What was decided?"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button type="submit" className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all shadow-lg">
                Ask Question
              </button>
            </form>
            
            {chatAnswer && (
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400/40 rounded-lg">
                <p className="text-slate-100">{chatAnswer}</p>
              </div>
            )}

            {chatError && (
              <div className="mt-3 text-sm text-red-200 bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2">
                {chatError}
              </div>
            )}
          </div>

          {/* Keywords */}
          {session.keywords && session.keywords.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-3">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {session.keywords.map((kw, idx) => (
                  <span key={idx} className="px-3 py-1 bg-dark-border text-gray-300 rounded-full text-sm">
                    {kw.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Speakers */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-100 mb-3">Speakers</h2>
            <div className="space-y-2">
              {session.speakers.map((speaker, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                  <span className="text-slate-200 flex items-center font-medium">
                    <User className="w-4 h-4 mr-2" />
                    {speaker.speaker_id}
                  </span>
                  <span className="text-slate-300 text-sm">
                    {speaker.total_duration.toFixed(1)}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

function getEmotionColor(emotion) {
  const colors = {
    happy: 'bg-green-500/20 text-green-400',
    neutral: 'bg-gray-500/20 text-gray-400',
    angry: 'bg-red-500/20 text-red-400',
    sad: 'bg-blue-500/20 text-blue-400',
    stressed: 'bg-yellow-500/20 text-yellow-400',
    surprised: 'bg-purple-500/20 text-purple-400'
  }
  return colors[emotion] || colors.neutral
}
