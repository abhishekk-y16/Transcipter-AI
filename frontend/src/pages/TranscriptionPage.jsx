import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart3, Download, MessageSquare, Clock, User } from 'lucide-react'
import axios from 'axios'

export default function TranscriptionPage() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState(null)
  const [selectedSpeaker, setSelectedSpeaker] = useState('all')

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const response = await axios.get(`/api/transcription/session/${sessionId}`)
      setSession(response.data)
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatQuestion.trim()) return

    try {
      const response = await axios.post('/api/chatbot/ask', {
        session_id: sessionId,
        question: chatQuestion
      })
      setChatAnswer(response.data.answer)
    } catch (error) {
      console.error('Chat error:', error)
    }
  }

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`/api/export/${format}/${sessionId}`, {
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
    }
  }

  if (loading) {
    return <div className="text-center text-white">Loading...</div>
  }

  if (!session) {
    return <div className="text-center text-white">Session not found</div>
  }

  const filteredSegments = selectedSpeaker === 'all'
    ? session.segments
    : session.segments.filter(seg => seg.speaker === selectedSpeaker)

  const speakers = [...new Set(session.segments.map(seg => seg.speaker))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Transcription</h1>
          <p className="text-gray-400 mt-1">
            Session ID: {sessionId} • Duration: {session.duration.toFixed(1)}s • Language: {session.language}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Link
            to={`/analytics/${sessionId}`}
            className="btn-secondary"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          
          <div className="relative group">
            <button className="btn-primary">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-32 bg-dark-card border border-dark-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button onClick={() => handleExport('pdf')} className="block w-full text-left px-4 py-2 hover:bg-dark-border text-white">PDF</button>
              <button onClick={() => handleExport('docx')} className="block w-full text-left px-4 py-2 hover:bg-dark-border text-white">DOCX</button>
              <button onClick={() => handleExport('txt')} className="block w-full text-left px-4 py-2 hover:bg-dark-border text-white">TXT</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Transcript */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          {session.summary && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-3">Summary</h2>
              <p className="text-gray-300">{session.summary}</p>
              
              {session.action_items && session.action_items.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Action Items</h3>
                  <ul className="space-y-2">
                    {session.action_items.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-500">•</span>
                        <span className="text-gray-300">{item.task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Speaker Filter */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedSpeaker('all')}
              className={`px-4 py-2 rounded-lg ${selectedSpeaker === 'all' ? 'bg-blue-500 text-white' : 'bg-dark-card text-gray-400'}`}
            >
              All Speakers
            </button>
            {speakers.map(speaker => (
              <button
                key={speaker}
                onClick={() => setSelectedSpeaker(speaker)}
                className={`px-4 py-2 rounded-lg ${selectedSpeaker === speaker ? 'bg-blue-500 text-white' : 'bg-dark-card text-gray-400'}`}
              >
                {speaker}
              </button>
            ))}
          </div>

          {/* Transcript Segments */}
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold text-white">Transcript</h2>
            
            <div className="space-y-3">
              {filteredSegments.map((segment, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="text-blue-400 font-semibold">{segment.speaker}</span>
                    <span className="text-gray-500 text-sm">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {segment.start_time.toFixed(1)}s
                    </span>
                    {segment.emotion && (
                      <span className={`text-xs px-2 py-1 rounded ${getEmotionColor(segment.emotion)}`}>
                        {segment.emotion}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300">{segment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Chatbot */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Ask AI
            </h2>
            
            <form onSubmit={handleChatSubmit} className="space-y-3">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                placeholder="What was decided?"
                className="input"
              />
              <button type="submit" className="btn-primary w-full">
                Ask Question
              </button>
            </form>
            
            {chatAnswer && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-gray-300">{chatAnswer}</p>
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
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-3">Speakers</h2>
            <div className="space-y-2">
              {session.speakers.map((speaker, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-dark-border rounded">
                  <span className="text-gray-300 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    {speaker.speaker_id}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {speaker.total_duration.toFixed(1)}s
                  </span>
                </div>
              ))}
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
