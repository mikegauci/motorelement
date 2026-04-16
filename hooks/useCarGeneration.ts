'use client'

import { useState, useRef, useEffect } from 'react'
import type { Revision } from '@/components/shop/customizer/types'
import { PENDING_GENERATION_KEY } from '@/components/shop/customizer/constants'
import { removeWhiteBackground, joinNotes } from '@/components/shop/customizer/helpers'
import { useCustomizer } from '@/components/shop/customizer/CustomizerContext'

interface CarGenerationDeps {
  carImageDataUrl: string | null
  carModel: string
  showNumberPlate: boolean
  numberPlate: string
  customerNotes: string
  vehicleLocked: boolean
  setVehicleLocked: (v: boolean) => void
  composedPromptNotes: string
  setComposedPromptNotes: (v: string | ((prev: string) => string)) => void
  tweakNotes: string
  setTweakNotes: (v: string) => void
}

export function useCarGeneration(deps: CarGenerationDeps) {
  const { setArtworkUrl, setGenerationStatus } = useCustomizer()

  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [viewIndex, setViewIndex] = useState(0)
  const [activeCarRequest, setActiveCarRequest] = useState<{ requestId: string; endpointId: string } | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const generationPollRunRef = useRef(0)

  // Bridge artwork URL to context for mockup
  useEffect(() => {
    const transparentRev = revisions.find((r) => r.transparent)
    if (transparentRev) {
      setArtworkUrl(transparentRev.url)
      setGenerationStatus('done')
    } else if (revisions.length > 0) {
      setArtworkUrl(revisions[revisions.length - 1].url)
      setGenerationStatus('done')
    } else {
      setArtworkUrl(null)
      setGenerationStatus(status === 'running' ? 'running' : 'idle')
    }
  }, [revisions, status, setArtworkUrl, setGenerationStatus])

  function startTimer() {
    let t = 0
    timerRef.current = setInterval(() => { t++; setElapsed(t) }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  async function pollGenerationUntilComplete({ requestId, endpointId, runId }: { requestId: string; endpointId: string; runId: number }) {
    while (generationPollRunRef.current === runId) {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', requestId, endpointId, mode: 'car' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Status check failed (${res.status})`)
      const st = String(data.status || '').toUpperCase()
      if (st === 'COMPLETED') {
        if (!data.url) throw new Error('No image URL in completed result')
        return data.url as string
      }
      if (st === 'FAILED' || st === 'CANCELED') throw new Error(data.error || `Generation ${st.toLowerCase()}`)
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
    throw new Error('Generation polling cancelled')
  }

  async function finalizeGenerationFromUrl(url: string, notesSnapshot: string, wasLocked: boolean, tweakSnapshot: string) {
    let finalUrl = url
    let isTransparent = false
    try {
      finalUrl = await removeWhiteBackground(url)
      isTransparent = true
    } catch (bgErr) {
      console.warn('Auto background removal failed, keeping original:', bgErr)
    }
    setStatus('done')
    if (!wasLocked) {
      setRevisions([{ url: finalUrl, label: '1 · Initial', transparent: isTransparent }])
      setViewIndex(0)
      deps.setVehicleLocked(true)
      deps.setComposedPromptNotes(notesSnapshot || '')
    } else {
      const applied = (tweakSnapshot || '').trim()
      const short = applied.length > 42 ? `${applied.slice(0, 42)}…` : applied
      setRevisions((prev) => {
        const next = [
          ...prev,
          { url: finalUrl, label: `${prev.length + 1} · Tweak${short ? ` — ${short}` : ''}`, transparent: isTransparent },
        ]
        setViewIndex(next.length - 1)
        return next
      })
      deps.setComposedPromptNotes((prev: string) => joinNotes(prev, tweakSnapshot))
      deps.setTweakNotes('')
    }
  }

  async function resumePendingGeneration(pending: { requestId: string; endpointId: string; notesForPrompt?: string; wasLocked?: boolean; tweakNotes?: string }) {
    setStatus('running')
    setRunning(true)
    setElapsed(0)
    startTimer()
    const runId = Date.now()
    generationPollRunRef.current = runId
    setActiveCarRequest({ requestId: pending.requestId, endpointId: pending.endpointId })
    try {
      const generatedUrl = await pollGenerationUntilComplete({
        requestId: pending.requestId, endpointId: pending.endpointId, runId,
      })
      if (generationPollRunRef.current !== runId) return
      stopTimer()
      sessionStorage.removeItem(PENDING_GENERATION_KEY)
      await finalizeGenerationFromUrl(generatedUrl, pending.notesForPrompt || '', !!pending.wasLocked, pending.tweakNotes || '')
    } catch (err: unknown) {
      if (generationPollRunRef.current !== runId) return
      stopTimer()
      setStatus('error:' + ((err as Error).message || 'Generation failed'))
      sessionStorage.removeItem(PENDING_GENERATION_KEY)
    } finally {
      if (generationPollRunRef.current === runId) {
        setRunning(false)
        setActiveCarRequest(null)
      }
    }
  }

  async function cancelCarGeneration() {
    const req = activeCarRequest
    generationPollRunRef.current++
    stopTimer()
    setElapsed(0)
    setRunning(false)
    setStatus(revisions.length > 0 ? 'done' : '')
    setActiveCarRequest(null)
    try { sessionStorage.removeItem(PENDING_GENERATION_KEY) } catch (_) { /* ignore */ }
    if (!req?.requestId || !req?.endpointId) return
    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', requestId: req.requestId, endpointId: req.endpointId }),
      })
    } catch (_) { /* ignore */ }
  }

  async function runGeneration() {
    if (!deps.carImageDataUrl) { setStatus('error:Upload the car photo'); return }
    if (deps.vehicleLocked && !deps.tweakNotes.trim()) { setStatus('error:Add tweak notes to describe what to change'); return }
    setStatus('running')
    setElapsed(0)
    startTimer()
    setRunning(true)
    const runId = Date.now()
    generationPollRunRef.current = runId
    try {
      const isTweak = deps.vehicleLocked && revisions.length > 0
      const notesForPrompt = isTweak ? joinNotes(deps.composedPromptNotes, deps.tweakNotes) : deps.customerNotes
      const currentIllustrationUrl = isTweak ? revisions[viewIndex]?.url : undefined
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          carImageDataUrl: deps.carImageDataUrl,
          carModel: deps.carModel,
          showNumberPlate: deps.showNumberPlate,
          numberPlate: deps.numberPlate,
          customerNotes: notesForPrompt,
          ...(currentIllustrationUrl ? { tweakImageUrl: currentIllustrationUrl } : {}),
        }),
      })
      if (res.status === 413) { stopTimer(); setStatus('error:Image too large — try a smaller photo or lower resolution'); setRunning(false); return }
      const data = await res.json()
      if (!data.requestId || !data.endpointId) throw new Error(data.error || 'Failed to start generation')
      setActiveCarRequest({ requestId: data.requestId, endpointId: data.endpointId })
      sessionStorage.setItem(PENDING_GENERATION_KEY, JSON.stringify({
        requestId: data.requestId, endpointId: data.endpointId,
        wasLocked: deps.vehicleLocked, notesForPrompt, tweakNotes: deps.tweakNotes,
      }))
      const generatedUrl = await pollGenerationUntilComplete({ requestId: data.requestId, endpointId: data.endpointId, runId })
      if (generationPollRunRef.current !== runId) return
      stopTimer()
      sessionStorage.removeItem(PENDING_GENERATION_KEY)
      await finalizeGenerationFromUrl(generatedUrl, notesForPrompt, deps.vehicleLocked, deps.tweakNotes)
    } catch (err: unknown) {
      if (generationPollRunRef.current === runId) {
        stopTimer()
        sessionStorage.removeItem(PENDING_GENERATION_KEY)
        setStatus('error:' + (err as Error).message)
      }
    }
    if (generationPollRunRef.current === runId) { setRunning(false); setActiveCarRequest(null) }
  }

  function resetCarGeneration() {
    stopTimer()
    setStatus('')
    setElapsed(0)
    setRunning(false)
    setRevisions([])
    setViewIndex(0)
    setActiveCarRequest(null)
    generationPollRunRef.current++
    try { sessionStorage.removeItem(PENDING_GENERATION_KEY) } catch (_) { /* ignore */ }
  }

  return {
    running,
    status,
    setStatus,
    elapsed,
    revisions,
    setRevisions,
    viewIndex,
    setViewIndex,
    activeCarRequest,
    runGeneration,
    cancelCarGeneration,
    resumePendingGeneration,
    resetCarGeneration,
  }
}
