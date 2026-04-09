/* eslint-disable @typescript-eslint/ban-ts-comment -- large MVP UI bundle */
// @ts-nocheck — MVP customizer; migrate to typed helpers incrementally
'use client'
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities -- MVP customizer UI */
import { useState, useRef, useEffect, useMemo } from 'react'

import styles from './customizer/styles'
import {
  SESSION_KEY,
  PENDING_GENERATION_KEY,
  PENDING_BACKGROUND_KEY,
  BACKGROUND_PRESETS,
  CUSTOM_BACKGROUND_NEW,
  CUSTOM_BACKGROUND_PREFIX,
  COMPOSITE,
  TEXT_FONTS,
} from './customizer/constants'
import {
  createTextLayer,
  normalizeTextLayer,
  clampTextPct,
  clampTextFontSizePct,
  clampCompositeZoom,
  clampAdjust,
  clampCarScale,
  getCanvasAlignedYPct,
  getTextLayerBounds,
  getLayerId,
  loadImageElement,
  removeWhiteBackground,
  compressImageDataUrl,
  getBackgroundArtworkBounds,
  drawCompositeContent,
  drawCompositeFromSrc,
  downloadPngBlob,
  buildCompositePngBlob,
  readFileAsDataUrl,
  joinNotes,
} from './customizer/helpers'
import type { TextLayer, Revision, SavedCustomBackground, FontOption } from './customizer/types'

import VehicleInputForm from './customizer/VehicleInputForm'
import ResultViewer from './customizer/ResultViewer'
import BackgroundPresets from './customizer/BackgroundPresets'
import CompositeEditor from './customizer/CompositeEditor'
import TextLayerEditor from './customizer/TextLayerEditor'
import { useCustomizer } from './customizer/CustomizerContext'

export default function ProductCustomizer() {
  const { setArtworkUrl, setGenerationStatus } = useCustomizer()

  // ---------------------------------------------------------------------------
  // State (unchanged from monolith — internal to customizer)
  // ---------------------------------------------------------------------------
  const [carModel, setCarModel] = useState('')
  const [showNumberPlate, setShowNumberPlate] = useState(false)
  const [numberPlate, setNumberPlate] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [carImageDataUrl, setCarImageDataUrl] = useState(null)
  const [carImagePreview, setCarImagePreview] = useState(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [viewIndex, setViewIndex] = useState(0)
  const [vehicleLocked, setVehicleLocked] = useState(false)
  const [composedPromptNotes, setComposedPromptNotes] = useState('')
  const [tweakNotes, setTweakNotes] = useState('')

  const carFileRef = useRef()
  const timerRef = useRef(null)
  const resultSectionRef = useRef(null)
  const resultCardRef = useRef<HTMLDivElement>(null)
  const compositeStageRef = useRef(null)
  const compositeCanvasRef = useRef(null)
  const compositeRenderRef = useRef(() => {})
  const carAdjustXRef = useRef(0)
  const carAdjustYRef = useRef(0)
  const carScaleRef = useRef(1)
  const compositionZoomRef = useRef(1)
  const textLayersRef = useRef<TextLayer[]>([])

  const [sessionRestored, setSessionRestored] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [exportingComposite, setExportingComposite] = useState(false)
  const [savedCustomBackgrounds, setSavedCustomBackgrounds] = useState<SavedCustomBackground[]>([])
  const [customBackgroundImageDataUrl, setCustomBackgroundImageDataUrl] = useState(null)
  const [customBackgroundImagePreview, setCustomBackgroundImagePreview] = useState(null)
  const [customBackgroundValue, setCustomBackgroundValue] = useState('')
  const [customBackgroundGenerating, setCustomBackgroundGenerating] = useState(false)
  const [customBackgroundRemoving, setCustomBackgroundRemoving] = useState(false)
  const [customBackgroundElapsed, setCustomBackgroundElapsed] = useState(0)
  const [customBackgroundError, setCustomBackgroundError] = useState('')
  const [backgroundTweakNotes, setBackgroundTweakNotes] = useState('')
  const [isVehicleTweakOpen, setIsVehicleTweakOpen] = useState(false)
  const [isBackgroundTweakOpen, setIsBackgroundTweakOpen] = useState(false)
  const [carAdjustXPct, setCarAdjustXPct] = useState(0)
  const [carAdjustYPct, setCarAdjustYPct] = useState(0)
  const [carScale, setCarScale] = useState(1)
  const [compositionZoom, setCompositionZoom] = useState(1)
  const [textLayers, setTextLayers] = useState<TextLayer[]>([])
  const [selectedTextLayerId, setSelectedTextLayerId] = useState<string | null>(null)
  const [customFontOptions, setCustomFontOptions] = useState<FontOption[]>([])
  const [desktopDragEnabled, setDesktopDragEnabled] = useState(false)
  const [showMobileResultDock, setShowMobileResultDock] = useState(false)
  const [mobileCompositePreviewSrc, setMobileCompositePreviewSrc] = useState('')
  const [activeCarRequest, setActiveCarRequest] = useState(null)
  const [activeBackgroundRequest, setActiveBackgroundRequest] = useState(null)
  const customBackgroundTimerRef = useRef(null)
  const carDragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  })
  const textDragRef = useRef({
    active: false,
    pointerId: null,
    layerId: null,
    startPointerX: 0,
    startPointerY: 0,
    startSize: 1,
    startXPct: 0,
    startYPct: 0,
  })
  const customBackgroundFileRef = useRef(null)
  const generationPollRunRef = useRef(0)
  const backgroundPollRunRef = useRef(0)
  const loadedCustomFontFamiliesRef = useRef(new Set())

  const availableFontOptions = customFontOptions.length > 0 ? customFontOptions : TEXT_FONTS

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 721px) and (pointer: fine)')
    const update = () => setDesktopDragEnabled(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadFontOptions() {
      try {
        const res = await fetch('/api/fonts')
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !Array.isArray(data.fonts)) return
        if (!cancelled) setCustomFontOptions(data.fonts)
      } catch (_) {}
    }
    loadFontOptions()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!customFontOptions.length) return
    if (typeof FontFace === 'undefined' || !document?.fonts) return
    let cancelled = false
    async function loadCustomFonts() {
      for (const font of customFontOptions) {
        if (cancelled) return
        if (!font?.value || !font?.url) continue
        if (loadedCustomFontFamiliesRef.current.has(font.value)) continue
        try {
          const fontFace = new FontFace(font.value, `url(${font.url})`)
          await fontFace.load()
          document.fonts.add(fontFace)
          loadedCustomFontFamiliesRef.current.add(font.value)
        } catch (_) {}
      }
      if (!cancelled) compositeRenderRef.current()
    }
    loadCustomFonts()
    return () => { cancelled = true }
  }, [customFontOptions])

  useEffect(() => {
    if (!customFontOptions.length) return
    const allowed = new Set(availableFontOptions.map((font) => font.value))
    if (!allowed.size) return
    setTextLayers((prev) => {
      let changed = false
      const next = prev.map((layer) => {
        if (allowed.has(layer.fontFamily)) return layer
        changed = true
        return { ...layer, fontFamily: availableFontOptions[0].value }
      })
      return changed ? next : prev
    })
  }, [customFontOptions, availableFontOptions])

  // Resume pending generation on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_GENERATION_KEY)
      if (!raw) return
      const pending = JSON.parse(raw)
      if (!pending?.requestId || !pending?.endpointId) {
        sessionStorage.removeItem(PENDING_GENERATION_KEY)
        return
      }
      resumePendingGeneration(pending)
    } catch (_) {}
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_BACKGROUND_KEY)
      if (!raw) return
      const pending = JSON.parse(raw)
      if (!pending?.requestId || !pending?.endpointId || !pending?.kind) {
        sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
        return
      }
      resumePendingBackgroundGeneration(pending)
    } catch (_) {}
  }, [])

  // Session restore
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (typeof s.carModel === 'string' || typeof s.year === 'string') {
          const model = typeof s.carModel === 'string' ? s.carModel.trim() : ''
          const yearFromOldSession = typeof s.year === 'string' ? s.year.trim() : ''
          const combinedVehicle = [model, yearFromOldSession].filter(Boolean).join(', ')
          setCarModel(combinedVehicle)
        }
        if (typeof s.showNumberPlate === 'boolean') setShowNumberPlate(s.showNumberPlate)
        if (typeof s.numberPlate === 'string') setNumberPlate(s.numberPlate)
        if (typeof s.customerNotes === 'string') setCustomerNotes(s.customerNotes)
        if (typeof s.carImageDataUrl === 'string') {
          setCarImageDataUrl(s.carImageDataUrl)
          setCarImagePreview(s.carImagePreview ?? s.carImageDataUrl)
        }
        if (Array.isArray(s.revisions) && s.revisions.length > 0) {
          setRevisions(s.revisions)
          const max = s.revisions.length - 1
          const vi = typeof s.viewIndex === 'number' ? Math.min(Math.max(0, s.viewIndex), max) : max
          setViewIndex(vi)
        }
        if (s.vehicleLocked === true) setVehicleLocked(true)
        if (typeof s.composedPromptNotes === 'string') setComposedPromptNotes(s.composedPromptNotes)
        if (typeof s.tweakNotes === 'string') setTweakNotes(s.tweakNotes)
        if (typeof s.selectedPresetId === 'string' || s.selectedPresetId === null) {
          setSelectedPresetId(s.selectedPresetId ?? null)
        }
        if (Array.isArray(s.savedCustomBackgrounds)) setSavedCustomBackgrounds(s.savedCustomBackgrounds)
        if (typeof s.customBackgroundImageDataUrl === 'string') {
          setCustomBackgroundImageDataUrl(s.customBackgroundImageDataUrl)
          setCustomBackgroundImagePreview(s.customBackgroundImagePreview ?? s.customBackgroundImageDataUrl)
        }
        if (typeof s.customBackgroundValue === 'string') setCustomBackgroundValue(s.customBackgroundValue)
        if (typeof s.carAdjustXPct === 'number') setCarAdjustXPct(s.carAdjustXPct)
        if (typeof s.carAdjustYPct === 'number') setCarAdjustYPct(s.carAdjustYPct)
        if (typeof s.carScale === 'number') setCarScale(s.carScale)
        if (typeof s.compositionZoom === 'number') {
          setCompositionZoom(clampCompositeZoom(s.compositionZoom))
        } else if (typeof s.backgroundZoom === 'number') {
          setCompositionZoom(clampCompositeZoom(s.backgroundZoom))
        }
        if (Array.isArray(s.textLayers)) {
          const normalized = s.textLayers.map((layer, index) =>
            normalizeTextLayer(layer, `restored-text-${index + 1}`)
          )
          setTextLayers(normalized)
        }
        if (typeof s.selectedTextLayerId === 'string' || s.selectedTextLayerId === null) {
          setSelectedTextLayerId(s.selectedTextLayerId ?? null)
        }
        setStatus('done')
      }
    } catch (e) {
      console.warn('Session restore failed', e)
    }
    setSessionRestored(true)
  }, [])

  // Session persist
  useEffect(() => {
    if (!sessionRestored) return
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          carModel, showNumberPlate, numberPlate, customerNotes,
          carImageDataUrl, carImagePreview, revisions, viewIndex,
          vehicleLocked, composedPromptNotes, tweakNotes, selectedPresetId,
          savedCustomBackgrounds, customBackgroundImageDataUrl,
          customBackgroundImagePreview, customBackgroundValue,
          carAdjustXPct, carAdjustYPct, carScale, compositionZoom,
          textLayers, selectedTextLayerId,
        })
      )
    } catch (e) {
      console.warn('Session save failed (storage may be full)', e)
    }
  }, [
    sessionRestored, carModel, showNumberPlate, numberPlate, customerNotes,
    carImageDataUrl, carImagePreview, revisions, viewIndex,
    vehicleLocked, composedPromptNotes, tweakNotes, selectedPresetId,
    customBackgroundImageDataUrl, customBackgroundImagePreview,
    customBackgroundValue, savedCustomBackgrounds,
    carAdjustXPct, carAdjustYPct, carScale, compositionZoom,
    textLayers, selectedTextLayerId,
  ])

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

  // ---------------------------------------------------------------------------
  // File handlers
  // ---------------------------------------------------------------------------
  function handleCarFile(e) {
    const file = e.target.files[0]
    if (!file) return
    readFileAsDataUrl(file, async (dataUrl) => {
      setCarImagePreview(dataUrl)
      try {
        const compressed = await compressImageDataUrl(dataUrl)
        setCarImageDataUrl(compressed)
        setCarImagePreview(compressed)
      } catch {
        setCarImageDataUrl(dataUrl)
      }
    })
  }

  function handleCustomBackgroundFile(e) {
    const file = e.target.files[0]
    if (!file) return
    readFileAsDataUrl(file, async (dataUrl) => {
      setCustomBackgroundImagePreview(dataUrl)
      setCustomBackgroundError('')
      setSelectedPresetId(CUSTOM_BACKGROUND_NEW)
      try {
        const compressed = await compressImageDataUrl(dataUrl)
        setCustomBackgroundImageDataUrl(compressed)
        setCustomBackgroundImagePreview(compressed)
      } catch {
        setCustomBackgroundImageDataUrl(dataUrl)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Timer helpers
  // ---------------------------------------------------------------------------
  function startTimer() {
    let t = 0
    timerRef.current = setInterval(() => { t++; setElapsed(t) }, 1000)
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }
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

  // ---------------------------------------------------------------------------
  // Generation logic (car)
  // ---------------------------------------------------------------------------
  async function pollGenerationUntilComplete({ requestId, endpointId, runId }) {
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
        return data.url
      }
      if (st === 'FAILED' || st === 'CANCELED') throw new Error(data.error || `Generation ${st.toLowerCase()}`)
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
    throw new Error('Generation polling cancelled')
  }

  async function finalizeGenerationFromUrl(url, notesSnapshot, wasLocked, tweakSnapshot) {
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
      setVehicleLocked(true)
      setComposedPromptNotes(notesSnapshot || '')
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
      setComposedPromptNotes((prev) => joinNotes(prev, tweakSnapshot))
      setTweakNotes('')
    }
  }

  async function resumePendingGeneration(pending) {
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
    } catch (err) {
      if (generationPollRunRef.current !== runId) return
      stopTimer()
      setStatus('error:' + (err.message || 'Generation failed'))
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
    try { sessionStorage.removeItem(PENDING_GENERATION_KEY) } catch (_) {}
    if (!req?.requestId || !req?.endpointId) return
    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', requestId: req.requestId, endpointId: req.endpointId }),
      })
    } catch (_) {}
  }

  async function runGeneration() {
    if (!carImageDataUrl) { setStatus('error:Upload the car photo'); return }
    if (vehicleLocked && !tweakNotes.trim()) { setStatus('error:Add tweak notes to describe what to change'); return }
    setStatus('running')
    setElapsed(0)
    startTimer()
    setRunning(true)
    const runId = Date.now()
    generationPollRunRef.current = runId
    try {
      const notesForPrompt = vehicleLocked ? joinNotes(composedPromptNotes, tweakNotes) : customerNotes
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', carImageDataUrl, carModel, showNumberPlate, numberPlate, customerNotes: notesForPrompt }),
      })
      if (res.status === 413) { stopTimer(); setStatus('error:Image too large — try a smaller photo or lower resolution'); setRunning(false); return }
      const data = await res.json()
      if (!data.requestId || !data.endpointId) throw new Error(data.error || 'Failed to start generation')
      setActiveCarRequest({ requestId: data.requestId, endpointId: data.endpointId })
      sessionStorage.setItem(PENDING_GENERATION_KEY, JSON.stringify({
        requestId: data.requestId, endpointId: data.endpointId,
        wasLocked: vehicleLocked, notesForPrompt, tweakNotes,
      }))
      const generatedUrl = await pollGenerationUntilComplete({ requestId: data.requestId, endpointId: data.endpointId, runId })
      if (generationPollRunRef.current !== runId) return
      stopTimer()
      sessionStorage.removeItem(PENDING_GENERATION_KEY)
      await finalizeGenerationFromUrl(generatedUrl, notesForPrompt, vehicleLocked, tweakNotes)
    } catch (err) {
      if (generationPollRunRef.current === runId) {
        stopTimer()
        sessionStorage.removeItem(PENDING_GENERATION_KEY)
        setStatus('error:' + err.message)
      }
    }
    if (generationPollRunRef.current === runId) { setRunning(false); setActiveCarRequest(null) }
  }

  // ---------------------------------------------------------------------------
  // Background generation logic
  // ---------------------------------------------------------------------------
  async function pollBackgroundUntilComplete({ requestId, endpointId, runId }) {
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
        return data.url
      }
      if (st === 'FAILED' || st === 'CANCELED') throw new Error(data.error || `Background generation ${st.toLowerCase()}`)
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
    throw new Error('Background generation polling cancelled')
  }

  async function removeBackgroundForCustomBackground(sourceUrlOrDataUrl) {
    setCustomBackgroundRemoving(true)
    try {
      const body = sourceUrlOrDataUrl.startsWith('http://') || sourceUrlOrDataUrl.startsWith('https://')
        ? { imageUrl: sourceUrlOrDataUrl, addWhiteBorder: false, mode: 'circle-outside-only', circleInsetPx: 4 }
        : { imageBase64: sourceUrlOrDataUrl, addWhiteBorder: false, mode: 'circle-outside-only', circleInsetPx: 4 }
      const res = await fetch('/api/approve-transparent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Background remove failed (${res.status})`) }
      const blob = await res.blob()
      return await new Promise((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result)
        fr.onerror = reject
        fr.readAsDataURL(blob)
      })
    } finally {
      setCustomBackgroundRemoving(false)
    }
  }

  async function generateCustomThumb(resultUrl) {
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
      const x = c.getContext('2d', { alpha: true })
      x.fillStyle = '#0a0a0a'; x.fillRect(0, 0, size, size)
      const targetW = size * 0.9
      const targetH = (sh / sw) * targetW
      const dx = (size - targetW) / 2
      const dy = (size - targetH) / 2
      x.drawImage(img, sx, sy, sw, sh, dx, dy, targetW, targetH)
      return c.toDataURL('image/png')
    } catch (_) { return resultUrl }
  }

  async function finalizeCustomBackgroundResult(rawUrl, originalValue) {
    const cleaned = await removeBackgroundForCustomBackground(rawUrl)
    const thumb = await generateCustomThumb(cleaned)
    const newId = `${CUSTOM_BACKGROUND_PREFIX}${Date.now()}`
    const label = (originalValue || '').slice(0, 30) || 'Custom'
    setSavedCustomBackgrounds((prev) => [...prev, { id: newId, resultUrl: cleaned, thumbUrl: thumb, label, value: originalValue || '' }])
    setSelectedPresetId(newId)
    setCustomBackgroundImageDataUrl(null)
    setCustomBackgroundImagePreview(null)
    setCustomBackgroundValue('')
    if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
  }

  async function finalizeBackgroundTweakResult(rawUrl, combinedValue, baseLabel, tweakText) {
    const cleaned = await removeBackgroundForCustomBackground(rawUrl)
    const thumb = await generateCustomThumb(cleaned)
    const newId = `${CUSTOM_BACKGROUND_PREFIX}${Date.now()}`
    const short = (tweakText || '').trim().slice(0, 24)
    const label = `${baseLabel || 'Custom'} · ${short}`
    setSavedCustomBackgrounds((prev) => [...prev, { id: newId, resultUrl: cleaned, thumbUrl: thumb, label, value: combinedValue || '' }])
    setSelectedPresetId(newId)
    setBackgroundTweakNotes('')
  }

  async function resumePendingBackgroundGeneration(pending) {
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
    } catch (err) {
      if (backgroundPollRunRef.current !== runId) return
      setCustomBackgroundError(err.message || 'Background generation failed')
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
    try { sessionStorage.removeItem(PENDING_BACKGROUND_KEY) } catch (_) {}
    if (!req?.requestId || !req?.endpointId) return
    try {
      await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', requestId: req.requestId, endpointId: req.endpointId }),
      })
    } catch (_) {}
  }

  async function runCustomBackgroundGeneration() {
    if (!customBackgroundValue.trim()) { setCustomBackgroundError('Enter a value for Location/Theme'); return }
    setCustomBackgroundGenerating(true)
    const runId = Date.now()
    backgroundPollRunRef.current = runId
    startBackgroundTimer()
    setCustomBackgroundError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', mode: 'background', backgroundImageDataUrl: customBackgroundImageDataUrl, backgroundValue: customBackgroundValue.trim() }),
      })
      if (res.status === 413) { setCustomBackgroundError('Image too large — try a smaller photo or lower resolution'); return }
      const originalValue = customBackgroundValue.trim()
      const data = await res.json()
      if (!res.ok || !data.requestId || !data.endpointId) { setCustomBackgroundError(data.error || 'Background generation failed'); return }
      setActiveBackgroundRequest({ requestId: data.requestId, endpointId: data.endpointId })
      sessionStorage.setItem(PENDING_BACKGROUND_KEY, JSON.stringify({ kind: 'custom', requestId: data.requestId, endpointId: data.endpointId, originalValue }))
      const rawUrl = await pollBackgroundUntilComplete({ requestId: data.requestId, endpointId: data.endpointId, runId })
      if (backgroundPollRunRef.current !== runId) return
      await finalizeCustomBackgroundResult(rawUrl, originalValue)
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch (err) {
      if (backgroundPollRunRef.current === runId) {
        setCustomBackgroundError(err.message || 'Background generation failed')
        sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
      }
    } finally {
      if (backgroundPollRunRef.current === runId) { stopBackgroundTimer(); setCustomBackgroundGenerating(false); setActiveBackgroundRequest(null) }
    }
  }

  async function runBackgroundTweak() {
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
    } catch (err) {
      if (backgroundPollRunRef.current === runId) {
        setCustomBackgroundError(err.message || 'Background tweak failed')
        sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
      }
    } finally {
      if (backgroundPollRunRef.current === runId) { stopBackgroundTimer(); setCustomBackgroundGenerating(false); setActiveBackgroundRequest(null) }
    }
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------
  function reset() {
    stopTimer()
    try { sessionStorage.removeItem(SESSION_KEY) } catch (_) {}
    if (carFileRef.current) carFileRef.current.value = ''
    setStatus(''); setElapsed(0); setRunning(false)
    setVehicleLocked(false); setComposedPromptNotes(''); setTweakNotes('')
    setRevisions([]); setViewIndex(0)
    setSelectedPresetId(null); setSavedCustomBackgrounds([])
    setCustomBackgroundImageDataUrl(null); setCustomBackgroundImagePreview(null)
    setCustomBackgroundValue(''); setCustomBackgroundGenerating(false)
    setCustomBackgroundRemoving(false); setCustomBackgroundError('')
    setBackgroundTweakNotes('')
    setCarAdjustXPct(0); setCarAdjustYPct(0); setCarScale(1); setCompositionZoom(1)
    setTextLayers([]); setSelectedTextLayerId(null)
    setActiveCarRequest(null); setActiveBackgroundRequest(null)
    generationPollRunRef.current++; backgroundPollRunRef.current++
    try { sessionStorage.removeItem(PENDING_GENERATION_KEY); sessionStorage.removeItem(PENDING_BACKGROUND_KEY) } catch (_) {}
    if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
    setCarImageDataUrl(null); setCarImagePreview(null)
    setCarModel(''); setNumberPlate(''); setCustomerNotes('')
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const baseReady = carImageDataUrl && !running
  const canRun = vehicleLocked ? baseReady && !!tweakNotes.trim() : baseReady
  const isRunning = status === 'running'
  const isDone = status === 'done'
  const isError = status.startsWith('error')
  const showResults = isRunning || isError || revisions.length > 0

  const viewingUrl = revisions.length > 0 ? revisions[viewIndex]?.url : null
  const viewingTransparent = !!revisions[viewIndex]?.transparent
  const hasTransparentRevision = revisions.some((r) => r.transparent)

  const transparentCarUrlForPreset = useMemo(() => {
    const cur = revisions[viewIndex]
    if (cur?.transparent) return cur.url
    for (let i = revisions.length - 1; i >= 0; i--) {
      if (revisions[i].transparent) return revisions[i].url
    }
    return null
  }, [revisions, viewIndex])

  const selectedPreset = BACKGROUND_PRESETS.find((p) => p.id === selectedPresetId)
  const isCustomSavedSelection =
    typeof selectedPresetId === 'string' &&
    selectedPresetId.startsWith(CUSTOM_BACKGROUND_PREFIX) &&
    selectedPresetId !== CUSTOM_BACKGROUND_NEW
  const selectedCustomBg = isCustomSavedSelection ? savedCustomBackgrounds.find((bg) => bg.id === selectedPresetId) : null
  const selectedBackgroundSrc = isCustomSavedSelection ? selectedCustomBg?.resultUrl ?? null : selectedPreset?.src ?? null
  const selectedBackgroundIsCustom = isCustomSavedSelection
  const showUnifiedCompositeResult = !!transparentCarUrlForPreset
  const mobileResultDockSrc = showUnifiedCompositeResult
    ? mobileCompositePreviewSrc || transparentCarUrlForPreset || viewingUrl
    : viewingUrl
  const showCustomPanel = selectedPresetId === CUSTOM_BACKGROUND_NEW
  const backgroundControlsLocked = customBackgroundGenerating
  const canGenerateCustomBackground = !!customBackgroundValue.trim() && !customBackgroundGenerating && !customBackgroundRemoving

  const selectedTextLayer = useMemo(
    () => textLayers.find((layer) => layer.id === selectedTextLayerId) || null,
    [textLayers, selectedTextLayerId]
  )

  // ---------------------------------------------------------------------------
  // Composite canvas effects & pointer handlers
  // ---------------------------------------------------------------------------
  useEffect(() => {
    carAdjustXRef.current = carAdjustXPct
    carAdjustYRef.current = carAdjustYPct
    carScaleRef.current = carScale
    compositionZoomRef.current = compositionZoom
    compositeRenderRef.current()
  }, [carAdjustXPct, carAdjustYPct, carScale, compositionZoom])

  useEffect(() => { textLayersRef.current = textLayers; compositeRenderRef.current() }, [textLayers])

  useEffect(() => {
    if (!selectedTextLayerId) return
    if (textLayers.some((layer) => layer.id === selectedTextLayerId)) return
    setSelectedTextLayerId(textLayers[0]?.id ?? null)
  }, [textLayers, selectedTextLayerId])

  useEffect(() => {
    if (!transparentCarUrlForPreset) return
    const stage = compositeStageRef.current
    const canvas = compositeCanvasRef.current
    if (!stage || !canvas) return
    let cancelled = false
    let bgImg = null
    let carImg = null
    function paint() {
      if (cancelled || !carImg) return
      if (selectedBackgroundSrc && !bgImg) return
      const cssSize = Math.min(Math.floor(stage.clientWidth), 720)
      if (cssSize < 2) return
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3))
      const pixelSize = Math.round(cssSize * dpr)
      if (canvas.width !== pixelSize) canvas.width = pixelSize
      if (canvas.height !== pixelSize) canvas.height = pixelSize
      const ctx = canvas.getContext('2d', { alpha: true })
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
      ctx.clearRect(0, 0, pixelSize, pixelSize)
      drawCompositeContent(ctx, pixelSize, selectedBackgroundSrc ? bgImg : null, carImg, {
        cropBackgroundToArtwork: selectedBackgroundIsCustom,
        carOffsetXPct: carAdjustXRef.current, carOffsetYPct: carAdjustYRef.current,
        carScale: carScaleRef.current, textLayers: textLayersRef.current,
        compositionZoom: compositionZoomRef.current,
      })
      try { setMobileCompositePreviewSrc(canvas.toDataURL('image/png')) } catch (_) {}
    }
    compositeRenderRef.current = paint
    const bgPromise = selectedBackgroundSrc ? loadImageElement(selectedBackgroundSrc) : Promise.resolve(null)
    Promise.all([bgPromise, loadImageElement(transparentCarUrlForPreset)]).then(([nextBgImg, nextCarImg]) => {
      if (cancelled) return
      bgImg = nextBgImg; carImg = nextCarImg; paint()
    })
    const ro = new ResizeObserver(() => paint())
    ro.observe(stage)
    return () => { cancelled = true; compositeRenderRef.current = () => {}; ro.disconnect() }
  }, [selectedBackgroundSrc, selectedBackgroundIsCustom, transparentCarUrlForPreset])

  useEffect(() => {
    if (showUnifiedCompositeResult) return
    setMobileCompositePreviewSrc('')
  }, [showUnifiedCompositeResult, viewingUrl])

  useEffect(() => {
    if (!showResults) { setShowMobileResultDock(false); return }
    function syncMobileDockVisibility() {
      const card = resultCardRef.current
      if (!card) { setShowMobileResultDock(false); return }
      const rect = card.getBoundingClientRect()
      setShowMobileResultDock(rect.bottom < 200)
    }
    syncMobileDockVisibility()
    window.addEventListener('scroll', syncMobileDockVisibility, { passive: true })
    window.addEventListener('resize', syncMobileDockVisibility)
    return () => { window.removeEventListener('scroll', syncMobileDockVisibility); window.removeEventListener('resize', syncMobileDockVisibility) }
  }, [showResults])

  // ---------------------------------------------------------------------------
  // Export composite
  // ---------------------------------------------------------------------------
  async function handleExportComposite() {
    if (!transparentCarUrlForPreset) return
    setExportingComposite(true)
    try {
      const fileSlug = !selectedBackgroundSrc ? 'car-transparent' : isCustomSavedSelection ? 'car-custom-background' : `car-${selectedPreset?.id || 'background'}`
      const blob = await buildCompositePngBlob({
        bgSrc: selectedBackgroundSrc || null, carSrc: transparentCarUrlForPreset,
        cropBackgroundToArtwork: selectedBackgroundIsCustom,
        carOffsetXPct: carAdjustXPct, carOffsetYPct: carAdjustYPct,
        carScale, textLayers, compositionZoom,
      })
      downloadPngBlob(blob, fileSlug)
      const fd = new FormData()
      fd.append('file', blob, `${fileSlug}.png`)
      fd.append('metadata', JSON.stringify({
        kind: 'print_export', file_slug: fileSlug,
        preset_id: selectedPreset?.id ?? null, preset_label: selectedPreset?.label ?? null,
        is_custom_saved_background: isCustomSavedSelection,
        custom_background_label: selectedCustomBg?.label ?? null,
        crop_background_to_artwork: selectedBackgroundIsCustom,
        car_adjust_x_pct: carAdjustXPct, car_adjust_y_pct: carAdjustYPct,
        car_scale: carScale, composition_zoom: compositionZoom,
        text_layer_count: textLayers.length,
      }))
      const saveRes = await fetch('/api/save-artwork', { method: 'POST', body: fd })
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}))
        console.warn('Could not save artwork to Supabase:', err.error || saveRes.status)
      }
    } catch (e) {
      alert(e.message || 'Export failed')
    } finally {
      setExportingComposite(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Text layer handlers
  // ---------------------------------------------------------------------------
  function addTextLayer() {
    const id = getLayerId()
    const layer = createTextLayer(id, availableFontOptions[0]?.value || 'Arial')
    setTextLayers((prev) => [...prev, layer])
    setSelectedTextLayerId(id)
  }

  function updateTextLayer(layerId, patch) {
    setTextLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer
        const next = { ...layer, ...patch }
        if (typeof next.xPct === 'number') next.xPct = clampTextPct(next.xPct)
        if (typeof next.yPct === 'number') next.yPct = clampTextPct(next.yPct)
        if (typeof next.fontSizePct === 'number') next.fontSizePct = clampTextFontSizePct(next.fontSizePct)
        return next
      })
    )
  }

  function nudgeTextFontSize(layerId, delta) {
    const layer = textLayersRef.current.find((it) => it.id === layerId)
    if (!layer) return
    updateTextLayer(layerId, { fontSizePct: layer.fontSizePct + delta })
  }

  function alignTextLayerToCanvasVertical(layerId, nextAlignY) {
    updateTextLayer(layerId, { alignY: nextAlignY, yPct: getCanvasAlignedYPct(nextAlignY) })
  }

  function removeTextLayer(layerId) {
    setTextLayers((prev) => prev.filter((layer) => layer.id !== layerId))
  }

  function moveTextLayer(layerId, direction) {
    setTextLayers((prev) => {
      const index = prev.findIndex((layer) => layer.id === layerId)
      if (index < 0) return prev
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  // ---------------------------------------------------------------------------
  // Composite pointer handlers
  // ---------------------------------------------------------------------------
  function getCompositePointerPixel(e) {
    const stage = compositeStageRef.current
    const canvas = compositeCanvasRef.current
    if (!stage || !canvas) return null
    const rect = stage.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function handleCompositePointerDown(e) {
    if (!transparentCarUrlForPreset) return
    const stage = compositeStageRef.current
    const canvas = compositeCanvasRef.current
    if (!stage) return
    if (selectedTextLayerId && canvas) {
      const activeLayer = textLayersRef.current.find((layer) => layer.id === selectedTextLayerId)
      const pointer = getCompositePointerPixel(e)
      if (activeLayer && pointer) {
        const ctx = canvas.getContext('2d', { alpha: true })
        if (ctx) {
          const bounds = getTextLayerBounds(ctx, canvas.width, activeLayer)
          if (bounds) {
            const pad = Math.max(10, canvas.width * 0.015)
            const inBounds =
              pointer.x >= bounds.left - pad && pointer.x <= bounds.left + bounds.width + pad &&
              pointer.y >= bounds.top - pad && pointer.y <= bounds.top + bounds.height + pad
            if (inBounds) {
              const drag = textDragRef.current
              drag.active = true; drag.pointerId = e.pointerId; drag.layerId = activeLayer.id
              drag.startPointerX = pointer.x; drag.startPointerY = pointer.y
              drag.startSize = Math.max(1, canvas.width)
              drag.startXPct = activeLayer.xPct; drag.startYPct = activeLayer.yPct
              stage.setPointerCapture?.(e.pointerId)
              return
            }
          }
        }
      }
    }
    const drag = carDragRef.current
    drag.active = true; drag.pointerId = e.pointerId
    drag.startX = e.clientX; drag.startY = e.clientY
    drag.startOffsetX = carAdjustXPct; drag.startOffsetY = carAdjustYPct
    stage.setPointerCapture?.(e.pointerId)
  }

  function handleCompositePointerMove(e) {
    const textDrag = textDragRef.current
    if (textDrag.active && textDrag.pointerId === e.pointerId) {
      const pointer = getCompositePointerPixel(e)
      if (!pointer) return
      updateTextLayer(textDrag.layerId, {
        xPct: textDrag.startXPct + (pointer.x - textDrag.startPointerX) / textDrag.startSize,
        yPct: textDrag.startYPct + (pointer.y - textDrag.startPointerY) / textDrag.startSize,
      })
      return
    }
    const drag = carDragRef.current
    if (!drag.active || drag.pointerId !== e.pointerId) return
    const stage = compositeStageRef.current
    if (!stage) return
    const size = Math.max(1, stage.clientWidth)
    setCarAdjustXPct(clampAdjust(drag.startOffsetX + (e.clientX - drag.startX) / size))
    setCarAdjustYPct(clampAdjust(drag.startOffsetY + (e.clientY - drag.startY) / size))
  }

  function handleCompositePointerUp(e) {
    const textDrag = textDragRef.current
    if (textDrag.active && textDrag.pointerId === e.pointerId) {
      textDrag.active = false; textDrag.pointerId = null; textDrag.layerId = null
      compositeStageRef.current?.releasePointerCapture?.(e.pointerId)
      return
    }
    const drag = carDragRef.current
    if (!drag.active || drag.pointerId !== e.pointerId) return
    drag.active = false; drag.pointerId = null
    compositeStageRef.current?.releasePointerCapture?.(e.pointerId)
  }

  function nudgeCompositeZoom(delta) {
    setCompositionZoom((prev) => clampCompositeZoom(prev + delta))
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  function renderCompositeStage() {
    return (
      <div
        className={styles.compositeStage}
        ref={compositeStageRef}
        onPointerDown={desktopDragEnabled ? handleCompositePointerDown : undefined}
        onPointerMove={desktopDragEnabled ? handleCompositePointerMove : undefined}
        onPointerUp={desktopDragEnabled ? handleCompositePointerUp : undefined}
        onPointerCancel={desktopDragEnabled ? handleCompositePointerUp : undefined}
      >
        <div
          className={styles.canvasSpaceControls}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className={styles.compositeNudgeBtn} onClick={() => setCompositionZoom(1)} disabled={backgroundControlsLocked || compositionZoom === 1} aria-label="Reset zoom" title="Reset zoom">↻</button>
          <button type="button" className={styles.compositeNudgeBtn} onClick={() => nudgeCompositeZoom(-0.05)} disabled={backgroundControlsLocked || compositionZoom <= 0.7} aria-label="Zoom out">-</button>
          <span className={styles.canvasSpaceValue}>{Math.round(compositionZoom * 100)}%</span>
          <button type="button" className={styles.compositeNudgeBtn} onClick={() => nudgeCompositeZoom(0.05)} disabled={backgroundControlsLocked || compositionZoom >= 1.4} aria-label="Zoom in">+</button>
        </div>
        <canvas ref={compositeCanvasRef} className={styles.compositeCanvas} aria-hidden />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Motor Element Product Customizer</h1>
          </div>
          <button type="button" className={styles.btnNewProject} onClick={reset}>
            New project
          </button>
        </div>
        <p className={styles.sessionHint}>
          Upload a photo of your car and we'll generate a vector illustration of it.
        </p>
      </div>

      <VehicleInputForm
        carModel={carModel}
        setCarModel={setCarModel}
        showNumberPlate={showNumberPlate}
        setShowNumberPlate={setShowNumberPlate}
        numberPlate={numberPlate}
        setNumberPlate={setNumberPlate}
        customerNotes={customerNotes}
        setCustomerNotes={setCustomerNotes}
        carImagePreview={carImagePreview}
        vehicleLocked={vehicleLocked}
        running={running}
        canRun={canRun}
        isDone={isDone}
        revCount={revisions.length}
        onUploadClick={() => carFileRef.current.click()}
        onGenerate={runGeneration}
        onCancel={cancelCarGeneration}
        onReset={reset}
      />
      <input
        ref={carFileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleCarFile}
      />

      {showResults && (
        <div className={styles.results} ref={resultSectionRef}>
          <h2 className={styles.resultsTitle}>Result</h2>
          <div className={styles.grid}>
            <ResultViewer
              status={status}
              elapsed={elapsed}
              revisions={revisions}
              viewIndex={viewIndex}
              setViewIndex={setViewIndex}
              viewingUrl={viewingUrl}
              viewingTransparent={viewingTransparent}
              showUnifiedCompositeResult={showUnifiedCompositeResult}
              renderCompositeStage={renderCompositeStage}
              resultCardRef={resultCardRef}
            />

            {(vehicleLocked || hasTransparentRevision) && (
              <div className={styles.resultSidePanel}>
                {vehicleLocked && (
                  <div className={styles.tweakPanel}>
                    <button
                      type="button"
                      className={styles.collapseToggle}
                      aria-expanded={isVehicleTweakOpen}
                      onClick={() => setIsVehicleTweakOpen((v) => !v)}
                    >
                      {isVehicleTweakOpen ? '▼' : '►'} Tweak vehicle (optional)
                    </button>
                    {isVehicleTweakOpen && (
                      <>
                        <div className={styles.setupBlock}>
                          <textarea
                            className={styles.textarea}
                            rows={4}
                            placeholder="Add more detail, or fix any issues with the generated vehicle."
                            value={tweakNotes}
                            onChange={(e) => setTweakNotes(e.target.value)}
                          />
                        </div>
                        <div className={styles.tweakPanelActions}>
                          <button className={styles.btnPrimary} onClick={runGeneration} disabled={!canRun}>
                            {running ? 'Generating…' : 'Tweak'}
                          </button>
                          {running && (
                            <button type="button" className={styles.btn} onClick={cancelCarGeneration}>
                              Cancel request
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {hasTransparentRevision && (
                  <>
                    <BackgroundPresets
                      selectedPresetId={selectedPresetId}
                      setSelectedPresetId={setSelectedPresetId}
                      savedCustomBackgrounds={savedCustomBackgrounds}
                      backgroundControlsLocked={backgroundControlsLocked}
                      customBackgroundGenerating={customBackgroundGenerating}
                      customBackgroundElapsed={customBackgroundElapsed}
                      onCancelBackgroundGeneration={cancelBackgroundGeneration}
                      showCustomPanel={showCustomPanel}
                      customBackgroundImagePreview={customBackgroundImagePreview}
                      customBackgroundValue={customBackgroundValue}
                      setCustomBackgroundValue={setCustomBackgroundValue}
                      canGenerateCustomBackground={canGenerateCustomBackground}
                      onCustomBackgroundUploadClick={() => customBackgroundFileRef.current?.click()}
                      onRunCustomBackgroundGeneration={runCustomBackgroundGeneration}
                      customBackgroundError={customBackgroundError}
                      isCustomSavedSelection={isCustomSavedSelection}
                      selectedCustomBg={selectedCustomBg}
                      isBackgroundTweakOpen={isBackgroundTweakOpen}
                      setIsBackgroundTweakOpen={setIsBackgroundTweakOpen}
                      backgroundTweakNotes={backgroundTweakNotes}
                      setBackgroundTweakNotes={setBackgroundTweakNotes}
                      customBackgroundRemoving={customBackgroundRemoving}
                      onRunBackgroundTweak={runBackgroundTweak}
                      onResetCustomPanel={() => {
                        setCustomBackgroundImageDataUrl(null)
                        setCustomBackgroundImagePreview(null)
                        setCustomBackgroundValue('')
                        setCustomBackgroundError('')
                        if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
                        setSelectedPresetId(CUSTOM_BACKGROUND_NEW)
                      }}
                    />
                    <input
                      ref={customBackgroundFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleCustomBackgroundFile}
                      disabled={backgroundControlsLocked}
                    />

                    {transparentCarUrlForPreset && (
                      <>
                        <CompositeEditor
                          carAdjustYPct={carAdjustYPct}
                          setCarAdjustYPct={(v) => setCarAdjustYPct(v)}
                          carScale={carScale}
                          setCarScale={(v) => setCarScale(v)}
                          compositionZoom={compositionZoom}
                          setCompositionZoom={(v) => setCompositionZoom(v)}
                          setCarAdjustXPct={(v) => setCarAdjustXPct(v)}
                          backgroundControlsLocked={backgroundControlsLocked}
                          renderCompositeStage={renderCompositeStage}
                        />
                        <TextLayerEditor
                          textLayers={textLayers}
                          selectedTextLayerId={selectedTextLayerId}
                          setSelectedTextLayerId={setSelectedTextLayerId}
                          selectedTextLayer={selectedTextLayer}
                          availableFontOptions={availableFontOptions}
                          backgroundControlsLocked={backgroundControlsLocked}
                          onAddTextLayer={addTextLayer}
                          onUpdateTextLayer={updateTextLayer}
                          onRemoveTextLayer={removeTextLayer}
                          onMoveTextLayer={moveTextLayer}
                          onNudgeTextFontSize={nudgeTextFontSize}
                          onAlignTextLayerToCanvasVertical={alignTextLayerToCanvasVertical}
                        />
                        <div className={styles.compositeExportRow}>
                          <button
                            type="button"
                            className={styles.btnExport}
                            onClick={handleExportComposite}
                            disabled={exportingComposite || backgroundControlsLocked}
                          >
                            {exportingComposite ? 'Preparing PNG…' : 'Download PNG for print'}
                          </button>
                          <span className={styles.compositeExportHint}>
                            Use top-right controls to zoom from center. Drag selected text to position it.
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!!mobileResultDockSrc && (
        <button
          type="button"
          className={`${styles.mobileResultDock} ${showMobileResultDock ? styles.mobileResultDockVisible : ''}`}
          onClick={() => resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          aria-label="Jump to result preview"
          aria-hidden={!showMobileResultDock}
          tabIndex={showMobileResultDock ? 0 : -1}
        >
          <img src={mobileResultDockSrc} alt="" />
        </button>
      )}
    </main>
  )
}
