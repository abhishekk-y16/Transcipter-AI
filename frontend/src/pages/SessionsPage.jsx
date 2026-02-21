import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Globe, FileText } from 'lucide-react'
import api from '../lib/api'

export default function SessionsPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setError('')
      const response = await api.get('/api/transcription/sessions')
      setSessions(response.data.sessions)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      const message = error?.response?.data?.detail || 'Failed to load sessions.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-white">Loading sessions...</div>
  }

  if (error) {
    return <div className="text-center text-white">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Transcription Sessions</h1>
        <p className="text-gray-400 mt-1">View and manage your past transcriptions</p>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No transcription sessions yet</p>
          <Link to="/" className="btn-primary mt-4 inline-flex items-center">
            Create First Transcription
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Link
              key={session.session_id}
              to={`/transcription/${session.session_id}`}
              className="card hover:border-blue-500/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Session {session.session_id.slice(0, 8)}...
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {session.duration.toFixed(1)}s
                    </span>
                    <span className="flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      {session.language}
                    </span>
                    <span>
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-blue-400">
                  View →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
