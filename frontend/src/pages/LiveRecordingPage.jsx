import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const selectMimeType = () => {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ]

  if (!window.MediaRecorder) return ''

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return ''
}

const buildWsUrl = (apiBase) => {
  const cleanBase = (apiBase || 'http://localhost:8000').replace(/\/+$/, '')
  const wsBase = cleanBase.replace(/^https?:/i, (match) => (match === 'https:' ? 'wss:' : 'ws:'))
  return `${wsBase}/api/transcription/stream`
}

export default function LiveRecordingPage() {
  const navigate = useNavigate()

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [transcript, setTranscript] = useState([])

  const wsRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)

  const apiBase = useMemo(() => import.meta.env.VITE_API_URL || 'http://localhost:8000', [])
  const wsUrl = useMemo(() => buildWsUrl(apiBase), [apiBase])

  const appendTranscript = (text) => {
    if (!text) return
    setTranscript((prev) => [...prev, text])
  }

  const stopAll = (closeWs = true) => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (wsRef.current && closeWs) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const startRecording = async () => {
    setError('')
    setTranscript([])
    setSessionId('')

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Microphone access is not supported in this browser.')
      return
    }

    setStatus('connecting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        const mimeType = selectMimeType()
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

        recorderRef.current = recorder
        setStatus('recording')

        try {
          ws.send(JSON.stringify({ event: 'start', mimeType: mimeType || 'audio/webm' }))
        } catch (startError) {
          setError('Failed to start streaming session.')
        }

        recorder.ondataavailable = async (event) => {
          if (!event.data || event.data.size === 0) return
          if (ws.readyState !== WebSocket.OPEN) return

          try {
            const buffer = await event.data.arrayBuffer()
            ws.send(buffer)
          } catch (sendError) {
            setError('Failed to send audio chunk.')
          }
        }

        recorder.onerror = () => {
          setError('Recorder error occurred.')
        }

        recorder.start(750)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data?.session_id) {
            setSessionId(data.session_id)
          }
          if (typeof data?.text === 'string') {
            appendTranscript(data.text)
          }
          if (data?.event === 'final') {
            ws.close()
            wsRef.current = null
            setStatus('stopped')
          }
        } catch (parseError) {
          // Ignore non-JSON messages
        }
      }

      ws.onerror = () => {
        setError('WebSocket error occurred.')
        setStatus('error')
      }

      ws.onclose = () => {
        setStatus((prev) => (prev === 'recording' || prev === 'connecting' ? 'stopped' : prev))
      }
    } catch (err) {
      setError('Microphone permission denied or unavailable.')
      setStatus('idle')
      stopAll()
    }
  }

  const stopRecording = () => {
    setStatus('processing')

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ event: 'stop' }))
      } catch (stopError) {
        setError('Failed to stop streaming session.')
      }
    }
  }

  useEffect(() => {
    return () => stopAll()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Live Transcription</h1>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white"
          >
            Back
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="text-xs uppercase tracking-wider text-zinc-400">Status</div>
            <div className="mt-2 text-lg font-medium">{status}</div>
            <div className="mt-3 text-xs text-zinc-400">Session ID: {sessionId || 'none'}</div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                status === 'recording'
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
              }`}
              onClick={status === 'recording' ? stopRecording : startRecording}
              disabled={status === 'connecting' || status === 'stopping' || status === 'processing'}
            >
              {status === 'processing'
                ? 'Processing...'
                : status === 'recording'
                  ? 'Stop Recording'
                  : 'Start Recording'}
            </button>

            <div className="mt-3 text-xs text-zinc-500">Streaming to {wsUrl}</div>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="text-xs uppercase tracking-wider text-zinc-400">Transcript</div>
            <div className="mt-3 min-h-[260px] space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm leading-relaxed text-zinc-200">
              {transcript.length === 0 ? (
                <div className="text-zinc-500">Start recording to see live text here.</div>
              ) : (
                transcript.map((line, idx) => (
                  <div key={`${idx}-${line.slice(0, 8)}`} className="rounded-md bg-zinc-900/60 px-3 py-2">
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}