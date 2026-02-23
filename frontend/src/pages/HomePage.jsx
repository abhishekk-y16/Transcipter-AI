import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Mic, Loader2, Zap, Users, Heart, BookOpen, Search, MessageSquare } from 'lucide-react'
import api from '../lib/api'
import SequenceScrubber from '../components/SequenceScrubber'

export default function HomePage() {
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [contentOpacity, setContentOpacity] = useState(0)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  // Calculate content opacity based on scroll position
  // Sequence 1: frames 0-240 (0-2880px) = opacity 0
  // Sequence 2: frames 240-480 (2880-5760px) = opacity 0 (hidden)
  // After Sequence 2 ends (5760px+) = fade in (Sequence 2 frame stays visible)
  useEffect(() => {
    const handleScrollForContent = () => {
      const sequence2ScrollEnd = 480 * 12; // 5760px - both sequences complete
      const fadeInRange = 600; // Fade in over 600px of scroll
      
      const currentScroll = window.scrollY;
      
      // Start fading in AFTER Sequence 2 completes (at 5760px)
      // Sequence 2 last frame remains visible behind content
      let opacity = 0;
      
      if (currentScroll >= sequence2ScrollEnd) {
        opacity = Math.min(1, (currentScroll - sequence2ScrollEnd) / fadeInRange);
      }
      
      setContentOpacity(opacity);
    };

    window.addEventListener('scroll', handleScrollForContent, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollForContent);
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return

    setIsUploading(true)
    setUploadError('')
    setUploadProgress(0)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/api/transcription/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        }
      })
      
      navigate(`/transcription/${response.data.session_id}`)
    } catch (error) {
      console.error('Upload error:', error)
      const message = error?.response?.data?.detail || 'Failed to upload file. Please try again.'
      setUploadError(message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
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
    navigate('/live')
  }

  return (
    <>
      {/* Cinematic Sequence Scrubber Hero */}
      <SequenceScrubber />

      {/* Main Page Content - Overlay while sequences play, then becomes main content */}
      <div className="relative z-20 min-h-screen bg-transparent overflow-hidden transition-opacity duration-300" style={{ opacity: contentOpacity }}>
      {/* Background decorative elements - very subtle */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>

      {/* Content */}
      <div className="relative z-30">
        {/* Big App Title */}
        <div className="text-center space-y-4 px-4 pt-16 pb-8 transition-all duration-300" style={{ 
          opacity: contentOpacity,
          transform: `translateY(${20 * (1 - contentOpacity)}px) scale(${0.95 + (0.05 * contentOpacity)})`
        }}>
          <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 tracking-tighter drop-shadow-2xl" style={{ textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)' }}>
            Transcripter AI
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full drop-shadow-md"></div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-6 px-4 py-8 transition-all duration-300" style={{
          opacity: contentOpacity,
          transform: `translateY(${30 * (1 - contentOpacity)}px)`
        }}>
          <h2 className="text-4xl font-light text-slate-100 tracking-tight drop-shadow-2xl" style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.6)' }}>
            AI-Powered Transcription Platform
          </h2>
          <p className="text-xl text-slate-100 max-w-3xl mx-auto font-light tracking-tight leading-relaxed drop-shadow-2xl" style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.6)' }}>
            Transform your audio into intelligent insights. Speaker identification, emotion analysis, and AI-generated summaries in seconds.
          </p>
        </div>

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4 pb-24 transition-all duration-300" style={{ 
          opacity: contentOpacity,
          transform: `translateY(${40 * (1 - contentOpacity)}px)`
        }}>
          {/* File Upload */}
          <div
            className={`rounded-3xl border-3 border-dashed transition-all cursor-pointer py-16 px-8 text-center drop-shadow-2xl backdrop-blur-sm ${
              dragActive
                ? 'border-blue-500 bg-blue-600/30 shadow-2xl scale-105'
                : 'border-blue-400 bg-gradient-to-br from-blue-500/25 to-blue-600/15 hover:border-blue-300 hover:from-blue-500/35 hover:to-blue-600/25 hover:shadow-2xl'
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
              <div className="space-y-4">
                <Loader2 className="w-16 h-16 text-blue-300 animate-spin mx-auto" />
                <div className="w-full max-w-xs mx-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-blue-200">Uploading...</span>
                    <span className="text-sm font-bold text-blue-100">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-900/30 rounded-full h-3 overflow-hidden border border-blue-400/30">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-blue-500/50"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <Upload className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            )}
            
            {!isUploading && (
              <>
                <h3 className="text-2xl font-bold text-white mt-4" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>Upload Audio</h3>
                <p className="text-blue-100 mt-3 text-base font-semibold" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}>
                  Drag & drop or click<br />
                  MP3, WAV, M4A, FLAC
                </p>
              </>
            )}
          </div>

          {/* Live Recording */}
          <div
            className="rounded-3xl border-3 border-dashed border-purple-400 bg-gradient-to-br from-purple-500/25 to-purple-600/15 hover:border-purple-300 hover:from-purple-500/35 hover:to-purple-600/25 cursor-pointer transition-all py-16 px-8 text-center hover:shadow-2xl drop-shadow-2xl backdrop-blur-sm hover:scale-105"
            onClick={handleRecording}
          >
            <Mic className="w-16 h-16 mx-auto mb-4 text-purple-300" />
            
            <h3 className="text-2xl font-bold text-white mt-4" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>Live Recording</h3>
            <p className="text-purple-100 mt-3 text-base font-semibold" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}>
              Record from microphone<br />
              Real-time transcription
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="max-w-5xl mx-auto bg-red-50 border border-red-300 text-red-900 rounded-lg px-4 py-3 text-sm mx-4 mb-8 drop-shadow-lg">
            {uploadError}
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 pb-20 transition-all duration-300" style={{ 
          opacity: contentOpacity,
          transform: `translateY(${50 * (1 - contentOpacity)}px)`
        }}>
          <FeatureCard 
            icon={Zap}
            title="High Accuracy" 
            description="Powered by Whisper AI for industry-leading transcription accuracy"
            color="from-yellow-500 to-orange-500"
            lightColor="from-yellow-400/20 to-orange-400/20"
          />
          <FeatureCard 
            icon={Users}
            title="Speaker Diarization" 
            description="Automatically identify and separate different speakers"
            color="from-blue-500 to-cyan-500"
            lightColor="from-blue-400/20 to-cyan-400/20"
          />
          <FeatureCard 
            icon={Heart}
            title="Emotion Analysis" 
            description="Detect emotions from voice tone and sentiment"
            color="from-pink-500 to-rose-500"
            lightColor="from-pink-400/20 to-rose-400/20"
          />
          <FeatureCard 
            icon={BookOpen}
            title="AI Summary" 
            description="Generate meeting summaries and action items automatically"
            color="from-purple-500 to-indigo-500"
            lightColor="from-purple-400/20 to-indigo-400/20"
          />
          <FeatureCard 
            icon={Search}
            title="Smart Search" 
            description="Search transcripts by keywords, speakers, or dates"
            color="from-green-500 to-teal-500"
            lightColor="from-green-400/20 to-teal-400/20"
          />
          <FeatureCard 
            icon={MessageSquare}
            title="AI Chatbot" 
            description="Ask questions about your transcripts"
            color="from-red-500 to-pink-500"
            lightColor="from-red-400/20 to-pink-400/20"
          />
        </div>
      </div>
      </div>
    </>
  )
}

function FeatureCard({ icon: Icon, title, description, color, lightColor }) {
  return (
    <div className={`group relative rounded-2xl border-2 border-white/20 bg-gradient-to-br ${lightColor} hover:border-white/40 hover:shadow-2xl transition-all duration-300 p-8 backdrop-blur-md hover:-translate-y-2`}>
      {/* Background gradient accent */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
      
      {/* Icon background */}
      <div className={`relative w-14 h-14 bg-gradient-to-br ${color} rounded-xl mb-6 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-3 relative z-10" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>{title}</h3>
      <p className="text-slate-100 text-sm font-medium leading-relaxed relative z-10" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)' }}>{description}</p>
    </div>
  )
}
