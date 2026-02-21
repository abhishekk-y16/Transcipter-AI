import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Mic, Loader2 } from 'lucide-react'
import axios from 'axios'

export default function HomePage() {
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleFileUpload = async (file) => {
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/transcription/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      navigate(`/transcription/${response.data.session_id}`)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleRecording = () => {
    alert('Live recording feature coming soon! Use WebSocket streaming.')
    // TODO: Implement WebSocket real-time recording
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-white">
          AI-Powered Transcription Intelligence
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Convert speech to text with speaker identification, emotion analysis, and AI-generated insights
        </p>
      </div>

      {/* Upload Section */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* File Upload */}
        <div
          className={`upload-card ${dragActive ? 'border-blue-500 bg-blue-500/10' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          
          {isUploading ? (
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
          ) : (
            <Upload className="w-16 h-16 text-blue-500 mx-auto" />
          )}
          
          <h3 className="text-xl font-semibold text-white mt-4">Upload Audio File</h3>
          <p className="text-gray-400 mt-2">
            Drag & drop or click to upload<br />
            Supports MP3, WAV, M4A, FLAC
          </p>
        </div>

        {/* Live Recording */}
        <div
          className="upload-card cursor-pointer hover:border-red-500 transition-colors"
          onClick={handleRecording}
        >
          <Mic className={`w-16 h-16 mx-auto ${isRecording ? 'text-red-500 animate-pulse' : 'text-red-400'}`} />
          
          <h3 className="text-xl font-semibold text-white mt-4">Live Recording</h3>
          <p className="text-gray-400 mt-2">
            Record from microphone<br />
            Real-time transcription
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12">
        <FeatureCard
          icon="🎯"
          title="High Accuracy"
          description="Powered by Whisper AI for industry-leading transcription accuracy"
        />
        <FeatureCard
          icon="👥"
          title="Speaker Diarization"
          description="Automatically identify and separate different speakers"
        />
        <FeatureCard
          icon="😊"
          title="Emotion Analysis"
          description="Detect emotions from voice tone and sentiment"
        />
        <FeatureCard
          icon="📝"
          title="AI Summary"
          description="Generate meeting summaries and action items automatically"
        />
        <FeatureCard
          icon="🔍"
          title="Smart Search"
          description="Search transcripts by keywords, speakers, or dates"
        />
        <FeatureCard
          icon="💬"
          title="AI Chatbot"
          description="Ask questions about your transcripts"
        />
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6 hover:border-blue-500/50 transition-colors">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  )
}
