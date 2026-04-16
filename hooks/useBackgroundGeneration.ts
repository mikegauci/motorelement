'use client'

import { useState, type RefObject } from 'react'
import type { SavedCustomBackground } from '@/components/shop/customizer/types'
import { PENDING_BACKGROUND_KEY, CUSTOM_BACKGROUND_PREFIX } from '@/components/shop/customizer/constants'
import { loadImageElement, getBackgroundArtworkBounds } from '@/components/shop/customizer/helpers'
import { useGenerationJob, writePending, clearPending } from './useGenerationJob'

interface BackgroundGenerationDeps {
  customBackgroundImageDataUrl: string | null
  customBackgroundValue: string
  setCustomBackgroundImageDataUrl: (v: string | null) => void
  setCustomBackgroundImagePreview: (v: string | null) => void
  setCustomBackgroundValue: (v: string) => void
  setSelectedPresetId: (v: string | null) => void
  customBackgroundFileRef: RefObject<HTMLInputElement | null>
}

export function useBackgroundGeneration(deps: BackgroundGenerationDeps) {
  const job = useGenerationJob(PENDING_BACKGROUND_KEY, 'background')

  const [savedCustomBackgrounds, setSavedCustomBackgrounds] = useState<SavedCustomBackground[]>([])
  const [customBackgroundRemoving, setCustomBackgroundRemoving] = useState(false)
  const [customBackgroundError, setCustomBackgroundError] = useState('')
  const [backgroundTweakNotes, setBackgroundTweakNotes] = useState('')

  async function removeBackgroundForCustomBackground(sourceUrlOrDataUrl: string) {
    setCustomBackgroundRemoving(true)
    try {
      const isHttp = sourceUrlOrDataUrl.startsWith('http://') || sourceUrlOrDataUrl.startsWith('https://')
      const body = isHttp
        ? { imageUrl: sourceUrlOrDataUrl, addWhiteBorder: true, mode: 'circle-outside-only', circleInsetPx: 4 }
        : { imageBase64: sourceUrlOrDataUrl, addWhiteBorder: true, mode: 'circle-outside-only', circleInsetPx: 4 }
      const res = await fetch('/api/approve-transparent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Background remove failed (${res.status})`) }
      const blob = await res.blob()
      return await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result as string)
        fr.onerror = reject
        fr.readAsDataURL(blob)
      })
    } finally {
      setCustomBackgroundRemoving(false)
    }
  }

  async function generateCustomThumb(resultUrl: string) {
    try {
      const img = await loadImageElement(resultUrl)
      const bounds = getBackgroundArtworkBounds(img)
      const sx = bounds ? bounds.minX : 0
      const sy = bounds ? bounds.minY : 0
      const sw = bounds ? bounds.w : img.naturalWidth
      const sh = bounds ? bounds.h : img.naturalHeight
      const size = 512
      const c = document.createElement('canvas')
      c.width = size; c.height = size
      const x = c.getContext('2d', { alpha: true })!
      x.fillStyle = '#0a0a0a'; x.fillRect(0, 0, size, size)
      const targetW = size * 0.9
      const targetH = (sh / sw) * targetW
      const dx = (size - targetW) / 2
      const dy = (size - targetH) / 2
      x.drawImage(img, sx, sy, sw, sh, dx, dy, targetW, targetH)
      return c.toDataURL('image/png')
    } catch (_) { return resultUrl }
  }

  async function persistToSupabase(dataUrl: string, label: string): Promise<string> {
    try {
      const res = await fetch('/api/save-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl, label }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.publicUrl) return data.publicUrl
      }
    } catch (_) { /* fall back to data URL */ }
    return dataUrl
  }

  async function finalizeCustomBackgroundResult(rawUrl: string, originalValue: string) {
    const cleaned = await removeBackgroundForCustomBackground(rawUrl)
    const label = (originalValue || '').slice(0, 30) || 'Custom'
    const resultUrl = await persistToSupabase(cleaned, label)
    const thumb = await generateCustomThumb(cleaned)
    const newId = `${CUSTOM_BACKGROUND_PREFIX}${Date.now()}`
    setSavedCustomBackgrounds((prev) => [...prev, { id: newId, resultUrl, thumbUrl: thumb, label, value: originalValue || '' }])
    deps.setSelectedPresetId(newId)
    deps.setCustomBackgroundImageDataUrl(null)
    deps.setCustomBackgroundImagePreview(null)
    deps.setCustomBackgroundValue('')
    if (deps.customBackgroundFileRef.current) deps.customBackgroundFileRef.current.value = ''
  }

  async function finalizeBackgroundTweakResult(rawUrl: string, combinedValue: string, baseLabel: string, tweakText: string) {
    const cleaned = await removeBackgroundForCustomBackground(rawUrl)
    const short = (tweakText || '').trim().slice(0, 24)
    const label = `${baseLabel || 'Custom'} · ${short}`
    const resultUrl = await persistToSupabase(cleaned, label)
    const thumb = await generateCustomThumb(cleaned)
    const newId = `${CUSTOM_BACKGROUND_PREFIX}${Date.now()}`
    setSavedCustomBackgrounds((prev) => [...prev, { id: newId, resultUrl, thumbUrl: thumb, label, value: combinedValue || '' }])
    deps.setSelectedPresetId(newId)
    setBackgroundTweakNotes('')
  }

  async function resumePendingBackgroundGeneration(pending: { requestId: string; endpointId: string; kind: string; combinedValue?: string; baseLabel?: string; tweakText?: string; originalValue?: string }) {
    setCustomBackgroundError('')
    const runId = job.beginRun()
    job.setActiveRequest({ requestId: pending.requestId, endpointId: pending.endpointId })
    try {
      const rawUrl = await job.poll(pending.requestId, pending.endpointId, runId)
      if (!job.isRunActive(runId)) return
      if (pending.kind === 'tweak') {
        await finalizeBackgroundTweakResult(rawUrl, pending.combinedValue || '', pending.baseLabel || 'Custom', pending.tweakText || '')
      } else {
        await finalizeCustomBackgroundResult(rawUrl, pending.originalValue || '')
      }
      clearPending(PENDING_BACKGROUND_KEY)
    } catch (err: unknown) {
      if (!job.isRunActive(runId)) return
      setCustomBackgroundError((err as Error).message || 'Background generation failed')
      clearPending(PENDING_BACKGROUND_KEY)
    } finally {
      job.endRun(runId)
    }
  }

  async function cancelBackgroundGeneration() {
    await job.cancel()
  }

  async function runCustomBackgroundGeneration() {
    if (!deps.customBackgroundValue.trim()) { setCustomBackgroundError('Enter a value for Location/Theme'); return }
    setCustomBackgroundError('')
    const runId = job.beginRun()
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', mode: 'background', backgroundImageDataUrl: deps.customBackgroundImageDataUrl, backgroundValue: deps.customBackgroundValue.trim() }),
      })
      if (res.status === 413) { setCustomBackgroundError('Image too large — try a smaller photo or lower resolution'); return }
      const originalValue = deps.customBackgroundValue.trim()
      const data = await res.json()
      if (!res.ok || !data.requestId || !data.endpointId) { setCustomBackgroundError(data.error || 'Background generation failed'); return }
      job.setActiveRequest({ requestId: data.requestId, endpointId: data.endpointId })
      writePending(PENDING_BACKGROUND_KEY, { kind: 'custom', requestId: data.requestId, endpointId: data.endpointId, originalValue })
      const rawUrl = await job.poll(data.requestId, data.endpointId, runId)
      if (!job.isRunActive(runId)) return
      await finalizeCustomBackgroundResult(rawUrl, originalValue)
      clearPending(PENDING_BACKGROUND_KEY)
    } catch (err: unknown) {
      if (job.isRunActive(runId)) {
        setCustomBackgroundError((err as Error).message || 'Background generation failed')
        clearPending(PENDING_BACKGROUND_KEY)
      }
    } finally {
      job.endRun(runId)
    }
  }

  async function runBackgroundTweak(selectedCustomBg: SavedCustomBackground | null) {
    if (!selectedCustomBg || !backgroundTweakNotes.trim()) return
    if (job.generating || customBackgroundRemoving) return
    const tweakText = backgroundTweakNotes.trim()
    setCustomBackgroundError('')
    const runId = job.beginRun()
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', mode: 'background', backgroundValue: tweakText, backgroundTweakImageUrl: selectedCustomBg.resultUrl }),
      })
      const data = await res.json()
      if (!res.ok || !data.requestId || !data.endpointId) { setCustomBackgroundError(data.error || 'Background tweak failed'); return }
      job.setActiveRequest({ requestId: data.requestId, endpointId: data.endpointId })
      writePending(PENDING_BACKGROUND_KEY, {
        kind: 'tweak', requestId: data.requestId, endpointId: data.endpointId,
        combinedValue: tweakText, baseLabel: selectedCustomBg.label, tweakText,
      })
      const rawUrl = await job.poll(data.requestId, data.endpointId, runId)
      if (!job.isRunActive(runId)) return
      await finalizeBackgroundTweakResult(rawUrl, tweakText, selectedCustomBg.label, tweakText)
      clearPending(PENDING_BACKGROUND_KEY)
    } catch (err: unknown) {
      if (job.isRunActive(runId)) {
        setCustomBackgroundError((err as Error).message || 'Background tweak failed')
        clearPending(PENDING_BACKGROUND_KEY)
      }
    } finally {
      job.endRun(runId)
    }
  }

  function resetBackgroundGeneration() {
    job.reset()
    setSavedCustomBackgrounds([])
    setCustomBackgroundRemoving(false)
    setCustomBackgroundError('')
    setBackgroundTweakNotes('')
  }

  return {
    savedCustomBackgrounds,
    setSavedCustomBackgrounds,
    customBackgroundGenerating: job.generating,
    customBackgroundRemoving,
    customBackgroundElapsed: job.elapsed,
    customBackgroundError,
    setCustomBackgroundError,
    backgroundTweakNotes,
    setBackgroundTweakNotes,
    runCustomBackgroundGeneration,
    runBackgroundTweak,
    cancelBackgroundGeneration,
    resumePendingBackgroundGeneration,
    resetBackgroundGeneration,
  }
}
