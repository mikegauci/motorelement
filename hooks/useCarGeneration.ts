'use client'

import { useState, useEffect } from 'react'
import type { Revision } from '@/components/shop/customizer/types'
import { PENDING_GENERATION_KEY } from '@/components/shop/customizer/constants'
import { removeWhiteBackground, joinNotes } from '@/components/shop/customizer/helpers'
import { useCustomizer } from '@/components/shop/customizer/CustomizerContext'
import { useGenerationJob, writePending, clearPending } from './useGenerationJob'

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
  const job = useGenerationJob(PENDING_GENERATION_KEY, 'car')

  const [status, setStatus] = useState('')
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [viewIndex, setViewIndex] = useState(0)

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
    const runId = job.beginRun()
    job.setActiveRequest({ requestId: pending.requestId, endpointId: pending.endpointId })
    try {
      const generatedUrl = await job.poll(pending.requestId, pending.endpointId, runId)
      if (!job.isRunActive(runId)) return
      job.stopTimer()
      clearPending(PENDING_GENERATION_KEY)
      await finalizeGenerationFromUrl(generatedUrl, pending.notesForPrompt || '', !!pending.wasLocked, pending.tweakNotes || '')
    } catch (err: unknown) {
      if (!job.isRunActive(runId)) return
      job.stopTimer()
      setStatus('error:' + ((err as Error).message || 'Generation failed'))
      clearPending(PENDING_GENERATION_KEY)
    } finally {
      job.endRun(runId)
    }
  }

  async function cancelCarGeneration() {
    await job.cancel()
    setStatus(revisions.length > 0 ? 'done' : '')
  }

  async function runGeneration() {
    if (!deps.carImageDataUrl) { setStatus('error:Upload the car photo'); return }
    if (deps.vehicleLocked && !deps.tweakNotes.trim()) { setStatus('error:Add tweak notes to describe what to change'); return }
    setStatus('running')
    const runId = job.beginRun()
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
      if (res.status === 413) { setStatus('error:Image too large — try a smaller photo or lower resolution'); return }
      const data = await res.json()
      if (!data.requestId || !data.endpointId) throw new Error(data.error || 'Failed to start generation')
      job.setActiveRequest({ requestId: data.requestId, endpointId: data.endpointId })
      writePending(PENDING_GENERATION_KEY, {
        requestId: data.requestId, endpointId: data.endpointId,
        wasLocked: deps.vehicleLocked, notesForPrompt, tweakNotes: deps.tweakNotes,
      })
      const generatedUrl = await job.poll(data.requestId, data.endpointId, runId)
      if (!job.isRunActive(runId)) return
      job.stopTimer()
      clearPending(PENDING_GENERATION_KEY)
      await finalizeGenerationFromUrl(generatedUrl, notesForPrompt, deps.vehicleLocked, deps.tweakNotes)
    } catch (err: unknown) {
      if (job.isRunActive(runId)) {
        job.stopTimer()
        clearPending(PENDING_GENERATION_KEY)
        setStatus('error:' + (err as Error).message)
      }
    } finally {
      job.endRun(runId)
    }
  }

  function resetCarGeneration() {
    job.reset()
    setStatus('')
    setRevisions([])
    setViewIndex(0)
  }

  return {
    running: job.generating,
    status,
    setStatus,
    elapsed: job.elapsed,
    revisions,
    setRevisions,
    viewIndex,
    setViewIndex,
    activeCarRequest: job.activeRequest,
    runGeneration,
    cancelCarGeneration,
    resumePendingGeneration,
    resetCarGeneration,
  }
}
