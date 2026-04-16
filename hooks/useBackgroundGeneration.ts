'use client'

import { useState, useRef, type RefObject } from 'react'
import type { SavedCustomBackground } from '@/components/shop/customizer/types'
import { PENDING_BACKGROUND_KEY, CUSTOM_BACKGROUND_PREFIX } from '@/components/shop/customizer/constants'
import { loadImageElement, getBackgroundArtworkBounds } from '@/components/shop/customizer/helpers'

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
  const [savedCustomBackgrounds, setSavedCustomBackgrounds] = useState<SavedCustomBackground[]>([])
  const [customBackgroundGenerating, setCustomBackgroundGenerating] = useState(false)
  const [customBackgroundRemoving, setCustomBackgroundRemoving] = useState(false)
  const [customBackgroundElapsed, setCustomBackgroundElapsed] = useState(0)
  const [customBackgroundError, setCustomBackgroundError] = useState('')
  const [backgroundTweakNotes, setBackgroundTweakNotes] = useState('')
  const [activeBackgroundRequest, setActiveBackgroundRequest] = useState<{ requestId: string; endpointId: string } | null>(null)

  const customBackgroundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const backgroundPollRunRef = useRef(0)

  function startBackgroundTimer() {
    if (customBackgroundTimerRef.current) clearInterval(customBackgroundTimerRef.current)
    let t = 0
    setCustomBackgroundElapsed(0)
    customBackgroundTimerRef.current = setInterval(() => { t++; setCustomBackgroundElapsed(t) }, 1000)
  }

  function stopBackgroundTimer() {
    if (customBackgroundTimerRef.current) clearInterval(customBackgroundTimerRef.current)
    customBackgroundTimerRef.current = null
  }

  async function pollBackgroundUntilComplete({ requestId, endpointId, runId }: { requestId: string; endpointId: string; runId: number }) {
    while (backgroundPollRunRef.current === runId) {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', requestId, endpointId, mode: 'background' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Status check failed (${res.status})`)
      const st = String(data.status || '').toUpperCase()
      if (st === 'COMPLETED') {
        if (!data.url) throw new Error('No image URL in completed background result')
        return data.url as string
      }
      if (st === 'FAILED' || st === 'CANCELED') throw new Error(data.error || `Background generation ${st.toLowerCase()}`)
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
    throw new Error('Background generation polling cancelled')
  }

  async function removeBackgroundForCustomBackground(sourceUrlOrDataUrl: string) {
    setCustomBackgroundRemoving(true)
    try {
      const isHttp = sourceUrlOrDataUrl.startsWith('http://') || sourceUrlOrDataUrl.startsWith('https://')
      const body = isHttp
        ? { imageUrl: sourceUrlOrDataUrl, addWhiteBorder: false, mode: 'circle-outside-only', circleInsetPx: 4 }
        : { imageBase64: sourceUrlOrDataUrl, addWhiteBorder: false, mode: 'circle-outside-only', circleInsetPx: 4 }
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
    setCustomBackgroundGenerating(true)
    startBackgroundTimer()
    setCustomBackgroundError('')
    const runId = Date.now()
    backgroundPollRunRef.current = runId
    setActiveBackgroundRequest({ requestId: pending.requestId, endpointId: pending.endpointId })
    try {
      const rawUrl = await pollBackgroundUntilComplete({ requestId: pending.requestId, endpointId: pending.endpointId, runId })
      if (backgroundPollRunRef.current !== runId) return
      if (pending.kind === 'tweak') {
        await finalizeBackgroundTweakResult(rawUrl, pending.combinedValue || '', pending.baseLabel || 'Custom', pending.tweakText || '')
      } else {
        await finalizeCustomBackgroundResult(rawUrl, pending.originalValue || '')
      }
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch (err: unknown) {
      if (backgroundPollRunRef.current !== runId) return
      setCustomBackgroundError((err as Error).message || 'Background generation failed')
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } finally {
      if (backgroundPollRunRef.current === runId) {
        stopBackgroundTimer()
        setCustomBackgroundGenerating(false)
        setActiveBackgroundRequest(null)
      }
    }
  }

  async function cancelBackgroundGeneration() {
    const req = activeBackgroundRequest
    backgroundPollRunRef.current++
    stopBackgroundTimer()
    setCustomBackgroundElapsed(0)
    setCustomBackgroundGenerating(false)
    setActiveBackgroundRequest(null)
    try { sessionStorage.removeItem(PENDING_BACKGROUND_KEY) } catch (_) { /* ignore */ }
    if (!req?.requestId || !req?.endpointId) return
    try {
      await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', requestId: req.requestId, endpointId: req.endpointId }),
      })
    } catch (_) { /* ignore */ }
  }

  async function runCustomBackgroundGeneration() {
    if (!deps.customBackgroundValue.trim()) { setCustomBackgroundError('Enter a value for Location/Theme'); return }
    setCustomBackgroundGenerating(true)
    const runId = Date.now()
    backgroundPollRunRef.current = runId
    startBackgroundTimer()
    setCustomBackgroundError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', mode: 'background', backgroundImageDataUrl: deps.customBackgroundImageDataUrl, backgroundValue: deps.customBackgroundValue.trim() }),
      })
      if (res.status === 413) { setCustomBackgroundError('Image too large — try a smaller photo or lower resolution'); return }
      const originalValue = deps.customBackgroundValue.trim()
      const data = await res.json()
      if (!res.ok || !data.requestId || !data.endpointId) { setCustomBackgroundError(data.error || 'Background generation failed'); return }
      setActiveBackgroundRequest({ requestId: data.requestId, endpointId: data.endpointId })
      sessionStorage.setItem(PENDING_BACKGROUND_KEY, JSON.stringify({ kind: 'custom', requestId: data.requestId, endpointId: data.endpointId, originalValue }))
      const rawUrl = await pollBackgroundUntilComplete({ requestId: data.requestId, endpointId: data.endpointId, runId })
      if (backgroundPollRunRef.current !== runId) return
      await finalizeCustomBackgroundResult(rawUrl, originalValue)
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch (err: unknown) {
      if (backgroundPollRunRef.current === runId) {
        setCustomBackgroundError((err as Error).message || 'Background generation failed')
        sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
      }
    } finally {
      if (backgroundPollRunRef.current === runId) { stopBackgroundTimer(); setCustomBackgroundGenerating(false); setActiveBackgroundRequest(null) }
    }
  }

  async function runBackgroundTweak(selectedCustomBg: SavedCustomBackground | null) {
    if (!selectedCustomBg || !backgroundTweakNotes.trim()) return
    if (customBackgroundGenerating || customBackgroundRemoving) return
    const combinedValue = `${selectedCustomBg.value}\n\n${backgroundTweakNotes.trim()}`
    setCustomBackgroundGenerating(true)
    const runId = Date.now()
    backgroundPollRunRef.current = runId
    startBackgroundTimer()
    setCustomBackgroundError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', mode: 'background', backgroundValue: combinedValue }),
      })
      const data = await res.json()
      if (!res.ok || !data.requestId || !data.endpointId) { setCustomBackgroundError(data.error || 'Background tweak failed'); return }
      setActiveBackgroundRequest({ requestId: data.requestId, endpointId: data.endpointId })
      const tweakText = backgroundTweakNotes.trim()
      sessionStorage.setItem(PENDING_BACKGROUND_KEY, JSON.stringify({
        kind: 'tweak', requestId: data.requestId, endpointId: data.endpointId,
        combinedValue, baseLabel: selectedCustomBg.label, tweakText,
      }))
      const rawUrl = await pollBackgroundUntilComplete({ requestId: data.requestId, endpointId: data.endpointId, runId })
      if (backgroundPollRunRef.current !== runId) return
      await finalizeBackgroundTweakResult(rawUrl, combinedValue, selectedCustomBg.label, tweakText)
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch (err: unknown) {
      if (backgroundPollRunRef.current === runId) {
        setCustomBackgroundError((err as Error).message || 'Background tweak failed')
        sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
      }
    } finally {
      if (backgroundPollRunRef.current === runId) { stopBackgroundTimer(); setCustomBackgroundGenerating(false); setActiveBackgroundRequest(null) }
    }
  }

  function resetBackgroundGeneration() {
    setSavedCustomBackgrounds([])
    setCustomBackgroundGenerating(false)
    setCustomBackgroundRemoving(false)
    setCustomBackgroundElapsed(0)
    setCustomBackgroundError('')
    setBackgroundTweakNotes('')
    setActiveBackgroundRequest(null)
    backgroundPollRunRef.current++
    stopBackgroundTimer()
    try { sessionStorage.removeItem(PENDING_BACKGROUND_KEY) } catch (_) { /* ignore */ }
  }

  return {
    savedCustomBackgrounds,
    setSavedCustomBackgrounds,
    customBackgroundGenerating,
    customBackgroundRemoving,
    customBackgroundElapsed,
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
