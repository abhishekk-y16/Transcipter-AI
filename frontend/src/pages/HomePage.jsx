import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Mic, Loader2 } from 'lucide-react'
import api from '../lib/api'

export default function HomePage() {
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleFileUpload = async (file) => {
    if (!file) return

    setIsUploading(true)
    setUploadError('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/api/transcription/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      navigate(`/transcription/${response.data.session_id}`)
    } catch (error) {
      console.error('Upload error:', error)
      const message = error?.response?.data?.detail || 'Failed to upload file. Please try again.'
      setUploadError(message)
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-6 px-4 py-20">
          <h1 className="text-6xl font-light text-slate-900 tracking-tight">
            AI-Powered Transcription
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
            Transform your audio into intelligent insights. Speaker identification, emotion analysis, and AI-generated summaries in seconds.
          </p>
        </div>

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto px-4 pb-16">
          {/* File Upload */}
          <div
            className={`rounded-2xl border-2 border-dashed transition-all cursor-pointer py-12 px-6 text-center ${
              dragActive
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-slate-400 bg-white/80 hover:border-blue-500 hover:bg-blue-50/80 hover:shadow-md'
            }`}
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
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            ) : (
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            )}
            
            <h3 className="text-lg font-semibold text-slate-900 mt-2">Upload Audio</h3>
            <p className="text-slate-600 mt-2 text-sm font-light">
              Drag & drop or click<br />
              MP3, WAV, M4A, FLAC
            </p>
          </div>

          {/* Live Recording */}
          <div
            className="rounded-2xl border-2 border-dashed border-slate-400 bg-white/80 hover:border-blue-500 hover:bg-blue-50/80 cursor-pointer transition-all py-12 px-6 text-center hover:shadow-md"
            onClick={handleRecording}
          >
            <Mic className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            
            <h3 className="text-lg font-semibold text-slate-900 mt-2">Live Recording</h3>
            <p className="text-slate-600 mt-2 text-sm font-light">
              Record from microphone<br />
              Real-time transcription
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="max-w-5xl mx-auto bg-red-50 border border-red-300 text-red-900 rounded-lg px-4 py-3 text-sm mx-4 mb-8">
            {uploadError}
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 pb-20">
          <FeatureCard title="High Accuracy" description="Powered by Whisper AI for industry-leading transcription accuracy" />
          <FeatureCard title="Speaker Diarization" description="Automatically identify and separate different speakers" />
          <FeatureCard title="Emotion Analysis" description="Detect emotions from voice tone and sentiment" />
          <FeatureCard title="AI Summary" description="Generate meeting summaries and action items automatically" />
          <FeatureCard title="Smart Search" description="Search transcripts by keywords, speakers, or dates" />
          <FeatureCard title="AI Chatbot" description="Ask questions about your transcripts" />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg mb-4"></div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm font-light leading-relaxed">{description}</p>
    </div>
  )
}
