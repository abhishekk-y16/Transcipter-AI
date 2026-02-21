import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts'
import axios from 'axios'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const { sessionId } = useParams()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [sessionId])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`/api/analytics/${sessionId}`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-white">Loading analytics...</div>
  }

  if (!analytics) {
    return <div className="text-center text-white">Analytics not available</div>
  }

  // Prepare data for charts
  const speakerData = analytics.speaker_stats.map(speaker => ({
    name: speaker.speaker_id,
    duration: parseFloat(speaker.total_duration.toFixed(1)),
    segments: speaker.segment_count
  }))

  const emotionData = Object.entries(
    analytics.speaker_stats.reduce((acc, speaker) => {
      Object.entries(speaker.emotion_distribution).forEach(([emotion, count]) => {
        acc[emotion] = (acc[emotion] || 0) + count
      })
      return acc
    }, {})
  ).map(([emotion, count]) => ({
    name: emotion,
    value: count
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/transcription/${sessionId}`} className="text-blue-400 hover:text-blue-300 flex items-center mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Transcript
          </Link>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Session ID: {sessionId} • Duration: {analytics.total_duration.toFixed(1)}s
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          title="Total Duration"
          value={`${(analytics.total_duration / 60).toFixed(1)} min`}
          icon="⏱️"
        />
        <StatCard
          title="Speakers"
          value={analytics.speaker_stats.length}
          icon="👥"
        />
        <StatCard
          title="Total Segments"
          value={analytics.speaker_stats.reduce((sum, s) => sum + s.segment_count, 0)}
          icon="💬"
        />
        <StatCard
          title="Top Keywords"
          value={analytics.top_keywords.length}
          icon="🔑"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Speaking Time Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Speaking Time by Speaker</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={speakerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
                labelStyle={{ color: '#e0e0e0' }}
              />
              <Legend />
              <Bar dataKey="duration" fill="#3b82f6" name="Duration (s)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Emotion Distribution */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Emotion Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={emotionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {emotionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Conversation Intensity */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Conversation Intensity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.conversation_intensity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="timestamp" stroke="#9ca3af" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke="#9ca3af" label={{ value: 'Words/min', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
                labelStyle={{ color: '#e0e0e0' }}
              />
              <Line type="monotone" dataKey="intensity" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Keywords */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Top Keywords</h2>
          <div className="flex flex-wrap gap-3">
            {analytics.top_keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Speaker Details Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">Speaker Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-3 px-4 text-gray-400">Speaker</th>
                <th className="text-left py-3 px-4 text-gray-400">Duration</th>
                <th className="text-left py-3 px-4 text-gray-400">Segments</th>
                <th className="text-left py-3 px-4 text-gray-400">Emotions</th>
              </tr>
            </thead>
            <tbody>
              {analytics.speaker_stats.map((speaker, idx) => (
                <tr key={idx} className="border-b border-dark-border hover:bg-dark-border/50">
                  <td className="py-3 px-4 text-white font-medium">{speaker.speaker_id}</td>
                  <td className="py-3 px-4 text-gray-300">{speaker.total_duration.toFixed(1)}s</td>
                  <td className="py-3 px-4 text-gray-300">{speaker.segment_count}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(speaker.emotion_distribution).map(([emotion, count]) => (
                        <span key={emotion} className="text-xs px-2 py-1 bg-dark-border text-gray-400 rounded">
                          {emotion}: {count}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}
