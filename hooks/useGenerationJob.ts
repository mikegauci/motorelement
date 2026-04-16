'use client'

import { useState, useRef } from 'react'

interface ActiveRequest {
  requestId: string
  endpointId: string
}

// ---- sessionStorage helpers ----

export function readPending<T extends { requestId: string; endpointId: string }>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.requestId || !parsed?.endpointId) {
      sessionStorage.removeItem(key)
      return null
    }
    return parsed as T
  } catch {
    return null
  }
}

export function writePending(key: string, data: Record<string, unknown>) {
  sessionStorage.setItem(key, JSON.stringify(data))
}

export function clearPending(key: string) {
  try { sessionStorage.removeItem(key) } catch { /* ignore */ }
}

// ---- Shared polling / cancel ----

async function pollUntilComplete(
  mode: string,
  requestId: string,
  endpointId: string,
  runId: number,
  pollRunRef: React.RefObject<number>,
): Promise<string> {
  while (pollRunRef.current === runId) {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', requestId, endpointId, mode }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Status check failed (${res.status})`)
    const st = String(data.status || '').toUpperCase()
    if (st === 'COMPLETED') {
      if (!data.url) throw new Error('No image URL in completed result')
      return data.url as string
    }
    if (st === 'FAILED' || st === 'CANCELED') {
      throw new Error(data.error || `Generation ${st.toLowerCase()}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
  throw new Error('Generation polling cancelled')
}

async function sendCancel(requestId: string, endpointId: string) {
  try {
    await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', requestId, endpointId }),
    })
  } catch { /* ignore */ }
}

// ---- Hook ----

export function useGenerationJob(pendingKey: string, mode: string) {
  const [generating, setGenerating] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRunRef = useRef(0)

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    let t = 0
    setElapsed(0)
    timerRef.current = setInterval(() => { t++; setElapsed(t) }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  function poll(requestId: string, endpointId: string, runId: number) {
    return pollUntilComplete(mode, requestId, endpointId, runId, pollRunRef)
  }

  function beginRun(): number {
    const runId = Date.now()
    pollRunRef.current = runId
    setGenerating(true)
    setElapsed(0)
    startTimer()
    return runId
  }

  function isRunActive(runId: number): boolean {
    return pollRunRef.current === runId
  }

  function endRun(runId: number) {
    if (pollRunRef.current === runId) {
      stopTimer()
      setGenerating(false)
      setActiveRequest(null)
    }
  }

  async function cancel() {
    const req = activeRequest
    pollRunRef.current++
    stopTimer()
    setElapsed(0)
    setGenerating(false)
    setActiveRequest(null)
    clearPending(pendingKey)
    if (req?.requestId && req?.endpointId) await sendCancel(req.requestId, req.endpointId)
  }

  function reset() {
    pollRunRef.current++
    stopTimer()
    setGenerating(false)
    setElapsed(0)
    setActiveRequest(null)
    clearPending(pendingKey)
  }

  return {
    generating, elapsed, activeRequest, setActiveRequest,
    pollRunRef,
    poll, beginRun, isRunActive, endRun,
    cancel, reset, stopTimer,
  }
}
