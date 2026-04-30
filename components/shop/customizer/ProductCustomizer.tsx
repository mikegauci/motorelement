'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useMemo } from 'react'
import styles from './styles'
import {
  SESSION_KEY,
  PENDING_GENERATION_KEY_FRONT,
  PENDING_GENERATION_KEY_BACK,
  PENDING_BACKGROUND_KEY,
  BACKGROUND_PRESETS,
  CUSTOM_BACKGROUND_NEW,
  CUSTOM_BACKGROUND_PREFIX,
  TEXT_FONTS,
} from './constants'
import {
  readFileAsDataUrl,
  compressImageDataUrl,
} from './helpers'
import type { FontOption, PrintSide, TextLayer } from './types'
import type { Dispatch, SetStateAction } from 'react'

import VehicleInputForm from './VehicleInputForm'
import BackgroundPresets from './BackgroundPresets'
import CompositeEditor from './CompositeEditor'
import TextLayerEditor from './TextLayerEditor'
import MockupPreviewModal from './MockupPreviewModal'
import CollapsibleTweak from './parts/CollapsibleTweak'

import { useCustomizer } from './CustomizerContext'
import { useSideDesign } from '@/hooks/useSideDesign'
import { useSideVehicle } from '@/hooks/useSideVehicle'
import { useBackgroundGeneration } from '@/hooks/useBackgroundGeneration'
import { useCompositeCanvas } from '@/hooks/useCompositeCanvas'
import { useSession } from '@/hooks/useSession'

export default function ProductCustomizer() {
  const {
    mockupThumbnailUrl,
    setArtworkUrl,
    setGenerationStatus,
    setMockupThumbnailUrl,
    selectedSide,
    setSelectedSide,
    backEnabled,
    setBackEnabled,
  } = useCustomizer()

  // ---- Shared background generation inputs (one generation runs at a time) ----
  const [customBackgroundImageDataUrl, setCustomBackgroundImageDataUrl] = useState<string | null>(null)
  const [customBackgroundImagePreview, setCustomBackgroundImagePreview] = useState<string | null>(null)
  const [customBackgroundValue, setCustomBackgroundValue] = useState('')
  const [isVehicleTweakOpen, setIsVehicleTweakOpen] = useState(false)
  const [isBackgroundTweakOpen, setIsBackgroundTweakOpen] = useState(false)

  // ---- UI state ----
  const [desktopDragEnabled, setDesktopDragEnabled] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [mobileDockDismissed, setMobileDockDismissed] = useState(false)
  const [customFontOptions, setCustomFontOptions] = useState<FontOption[]>([])
  const carFileRef = useRef<HTMLInputElement>(null)
  const customBackgroundFileRef = useRef<HTMLInputElement>(null)
  const loadedCustomFontFamiliesRef = useRef(new Set<string>())
  const mobileDockTouchStartXRef = useRef<number | null>(null)
  const mobileDockDidSwipeRef = useRef(false)

  const availableFontOptions = customFontOptions.length > 0 ? customFontOptions : TEXT_FONTS

  // ---- Per-side state: design (background, layout, text) and vehicle (photo, notes, generation) ----
  const frontDesign = useSideDesign(availableFontOptions)
  const backDesign = useSideDesign(availableFontOptions)
  const activeDesign = selectedSide === 'front' ? frontDesign : backDesign

  const frontVehicle = useSideVehicle(PENDING_GENERATION_KEY_FRONT)
  const backVehicle = useSideVehicle(PENDING_GENERATION_KEY_BACK)
  const activeVehicle = selectedSide === 'front' ? frontVehicle : backVehicle
  const activeCarGen = activeVehicle.carGen

  // ---- Hooks ----
  const bgGen = useBackgroundGeneration({
    customBackgroundImageDataUrl, customBackgroundValue,
    setCustomBackgroundImageDataUrl, setCustomBackgroundImagePreview,
    setCustomBackgroundValue,
    setSelectedPresetId: activeDesign.setSelectedPresetId,
    customBackgroundFileRef,
  })

  // ---- Derived state (active side) ----
  const baseReady = !!activeVehicle.carImageDataUrl && !activeCarGen.running
  const canRun = activeVehicle.vehicleLocked
    ? baseReady && !!activeVehicle.tweakNotes.trim()
    : baseReady
  const isRunning = activeCarGen.status === 'running'
  const isDone = activeCarGen.status === 'done'
  const hasTransparentRevision = activeCarGen.revisions.some((r) => r.transparent)
  const anySideHasTransparentRev =
    frontVehicle.carGen.revisions.some((r) => r.transparent) ||
    backVehicle.carGen.revisions.some((r) => r.transparent)
  // Editors are visible whenever at least one side has produced a transparent
  // car. That way the user can switch to the other side and design a
  // text/background-only layout without having to generate a car for it too.
  const editorsAvailable = hasTransparentRevision || anySideHasTransparentRev
  const showResults =
    isRunning ||
    activeCarGen.status.startsWith('error') ||
    activeCarGen.revisions.length > 0 ||
    editorsAvailable
  const viewingUrl = activeCarGen.revisions.length > 0 ? activeCarGen.revisions[activeCarGen.viewIndex]?.url : null

  const transparentCarUrlForPreset = useMemo(() => {
    const cur = activeCarGen.revisions[activeCarGen.viewIndex]
    if (cur?.transparent) return cur.url
    for (let i = activeCarGen.revisions.length - 1; i >= 0; i--) {
      if (activeCarGen.revisions[i].transparent) return activeCarGen.revisions[i].url
    }
    return null
  }, [activeCarGen.revisions, activeCarGen.viewIndex])

  // ---- Sync global Customizer context with the active side ----
  useEffect(() => {
    const transparentRev = activeCarGen.revisions.find((r) => r.transparent)
    if (transparentRev) {
      setArtworkUrl(transparentRev.url)
      setGenerationStatus('done')
    } else if (activeCarGen.revisions.length > 0) {
      setArtworkUrl(activeCarGen.revisions[activeCarGen.revisions.length - 1].url)
      setGenerationStatus('done')
    } else {
      setArtworkUrl(null)
      setMockupThumbnailUrl(null)
      setGenerationStatus(activeCarGen.status === 'running' ? 'running' : 'idle')
    }
  }, [
    activeCarGen.revisions,
    activeCarGen.status,
    setArtworkUrl,
    setGenerationStatus,
    setMockupThumbnailUrl,
  ])

  const selectedPreset = BACKGROUND_PRESETS.find((p) => p.id === activeDesign.selectedPresetId)
  const isCustomSavedSelection =
    typeof activeDesign.selectedPresetId === 'string' &&
    activeDesign.selectedPresetId.startsWith(CUSTOM_BACKGROUND_PREFIX) &&
    activeDesign.selectedPresetId !== CUSTOM_BACKGROUND_NEW
  const selectedCustomBg = isCustomSavedSelection
    ? bgGen.savedCustomBackgrounds.find((bg) => bg.id === activeDesign.selectedPresetId) ?? null
    : null
  const selectedBackgroundSrc = isCustomSavedSelection
    ? selectedCustomBg?.resultUrl ?? null
    : selectedPreset?.src ?? null
  const selectedBackgroundIsCustom = isCustomSavedSelection
  const showCustomPanel = activeDesign.selectedPresetId === CUSTOM_BACKGROUND_NEW
  const backgroundControlsLocked = bgGen.customBackgroundGenerating
  const canGenerateCustomBackground =
    !!customBackgroundValue.trim() && !bgGen.customBackgroundGenerating && !bgGen.customBackgroundRemoving

  const composite = useCompositeCanvas({
    side: selectedSide,
    transparentCarUrlForPreset, selectedBackgroundSrc, selectedBackgroundIsCustom,
    selectedPreset, isCustomSavedSelection, selectedCustomBg,
    carAdjustXPct: activeDesign.carAdjustXPct, setCarAdjustXPct: activeDesign.setCarAdjustXPct,
    carAdjustYPct: activeDesign.carAdjustYPct, setCarAdjustYPct: activeDesign.setCarAdjustYPct,
    carScale: activeDesign.carScale,
    compositionZoom: activeDesign.compositionZoom, setCompositionZoom: activeDesign.setCompositionZoom,
    bgScale: activeDesign.bgScale,
    textLayersRef: activeDesign.text.textLayersRef, textLayers: activeDesign.text.textLayers,
    selectedTextLayerId: activeDesign.text.selectedTextLayerId,
    updateTextLayer: activeDesign.text.updateTextLayer,
    backgroundControlsLocked,
    showResults,
    desktopDragEnabled,
  })

  const mobileResultDockSrc = mockupThumbnailUrl || viewingUrl

  // ---- Session ----
  useSession(
    {
      savedCustomBackgrounds: bgGen.savedCustomBackgrounds,
      customBackgroundImageDataUrl, customBackgroundImagePreview, customBackgroundValue,
      selectedSide, backEnabled,
      front: {
        selectedPresetId: frontDesign.selectedPresetId,
        carAdjustXPct: frontDesign.carAdjustXPct,
        carAdjustYPct: frontDesign.carAdjustYPct,
        carScale: frontDesign.carScale,
        compositionZoom: frontDesign.compositionZoom,
        bgScale: frontDesign.bgScale,
        textLayers: frontDesign.text.textLayers,
        selectedTextLayerId: frontDesign.text.selectedTextLayerId,
      },
      back: {
        selectedPresetId: backDesign.selectedPresetId,
        carAdjustXPct: backDesign.carAdjustXPct,
        carAdjustYPct: backDesign.carAdjustYPct,
        carScale: backDesign.carScale,
        compositionZoom: backDesign.compositionZoom,
        bgScale: backDesign.bgScale,
        textLayers: backDesign.text.textLayers,
        selectedTextLayerId: backDesign.text.selectedTextLayerId,
      },
      frontVehicle: {
        carImageDataUrl: frontVehicle.carImageDataUrl,
        carImagePreview: frontVehicle.carImagePreview,
        customerNotes: frontVehicle.customerNotes,
        revisions: frontVehicle.carGen.revisions,
        viewIndex: frontVehicle.carGen.viewIndex,
        vehicleLocked: frontVehicle.vehicleLocked,
        composedPromptNotes: frontVehicle.composedPromptNotes,
        tweakNotes: frontVehicle.tweakNotes,
      },
      backVehicle: {
        carImageDataUrl: backVehicle.carImageDataUrl,
        carImagePreview: backVehicle.carImagePreview,
        customerNotes: backVehicle.customerNotes,
        revisions: backVehicle.carGen.revisions,
        viewIndex: backVehicle.carGen.viewIndex,
        vehicleLocked: backVehicle.vehicleLocked,
        composedPromptNotes: backVehicle.composedPromptNotes,
        tweakNotes: backVehicle.tweakNotes,
      },
    },
    {
      setSavedCustomBackgrounds: bgGen.setSavedCustomBackgrounds,
      setCustomBackgroundImageDataUrl, setCustomBackgroundImagePreview, setCustomBackgroundValue,
      setSelectedSide, setBackEnabled,
      setFrontDesign: {
        setSelectedPresetId: frontDesign.setSelectedPresetId,
        setCarAdjustXPct: frontDesign.setCarAdjustXPct,
        setCarAdjustYPct: frontDesign.setCarAdjustYPct,
        setCarScale: frontDesign.setCarScale,
        setCompositionZoom: frontDesign.setCompositionZoom,
        setBgScale: frontDesign.setBgScale,
        setTextLayers: frontDesign.text.setTextLayers,
        setSelectedTextLayerId: frontDesign.text.setSelectedTextLayerId,
      },
      setBackDesign: {
        setSelectedPresetId: backDesign.setSelectedPresetId,
        setCarAdjustXPct: backDesign.setCarAdjustXPct,
        setCarAdjustYPct: backDesign.setCarAdjustYPct,
        setCarScale: backDesign.setCarScale,
        setCompositionZoom: backDesign.setCompositionZoom,
        setBgScale: backDesign.setBgScale,
        setTextLayers: backDesign.text.setTextLayers,
        setSelectedTextLayerId: backDesign.text.setSelectedTextLayerId,
      },
      setFrontVehicle: {
        setCarImageDataUrl: frontVehicle.setCarImageDataUrl,
        setCarImagePreview: frontVehicle.setCarImagePreview,
        setCustomerNotes: frontVehicle.setCustomerNotes,
        setRevisions: frontVehicle.carGen.setRevisions,
        setViewIndex: frontVehicle.carGen.setViewIndex,
        setVehicleLocked: frontVehicle.setVehicleLocked,
        setComposedPromptNotes: frontVehicle.setComposedPromptNotes,
        setTweakNotes: frontVehicle.setTweakNotes,
        setStatus: frontVehicle.carGen.setStatus,
        resumePendingGeneration: frontVehicle.carGen.resumePendingGeneration,
      },
      setBackVehicle: {
        setCarImageDataUrl: backVehicle.setCarImageDataUrl,
        setCarImagePreview: backVehicle.setCarImagePreview,
        setCustomerNotes: backVehicle.setCustomerNotes,
        setRevisions: backVehicle.carGen.setRevisions,
        setViewIndex: backVehicle.carGen.setViewIndex,
        setVehicleLocked: backVehicle.setVehicleLocked,
        setComposedPromptNotes: backVehicle.setComposedPromptNotes,
        setTweakNotes: backVehicle.setTweakNotes,
        setStatus: backVehicle.carGen.setStatus,
        resumePendingGeneration: backVehicle.carGen.resumePendingGeneration,
      },
      resumePendingBackgroundGeneration: bgGen.resumePendingBackgroundGeneration,
    }
  )

  // ---- Desktop media query ----
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 721px) and (pointer: fine)')
    const update = () => setDesktopDragEnabled(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // ---- Font loading ----
  useEffect(() => {
    let cancelled = false
    fetch('/api/fonts').then((r) => r.json()).then((data) => {
      if (!cancelled && Array.isArray(data.fonts)) setCustomFontOptions(data.fonts)
    }).catch(() => { })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!customFontOptions.length || typeof FontFace === 'undefined' || !document?.fonts) return
    let cancelled = false
      ; (async () => {
        for (const font of customFontOptions) {
          if (cancelled || !font?.value || !font?.url) continue
          if (loadedCustomFontFamiliesRef.current.has(font.value)) continue
          try {
            const ff = new FontFace(font.value, `url(${font.url})`)
            await ff.load()
            document.fonts.add(ff)
            loadedCustomFontFamiliesRef.current.add(font.value)
          } catch { /* ignore */ }
        }
        if (!cancelled) composite.compositeRenderRef.current()
      })()
    return () => { cancelled = true }
  }, [customFontOptions, composite.compositeRenderRef])

  useEffect(() => {
    if (!customFontOptions.length) return
    const allowed = new Set(availableFontOptions.map((f) => f.value))
    if (!allowed.size) return
    const fixLayers = (
      setLayers: Dispatch<SetStateAction<TextLayer[]>>,
    ) => {
      setLayers((prev) => {
        let changed = false
        const next = prev.map((layer) => {
          if (allowed.has(layer.fontFamily)) return layer
          changed = true
          return { ...layer, fontFamily: availableFontOptions[0].value }
        })
        return changed ? next : prev
      })
    }
    fixLayers(frontDesign.text.setTextLayers)
    fixLayers(backDesign.text.setTextLayers)
  }, [customFontOptions, availableFontOptions, frontDesign.text, backDesign.text])

  useEffect(() => {
    const text = activeDesign.text
    if (!text.selectedTextLayerId) return
    if (text.textLayers.some((l) => l.id === text.selectedTextLayerId)) return
    text.setSelectedTextLayerId(text.textLayers[0]?.id ?? null)
  }, [activeDesign.text])

  // ---- File handlers ----
  function handleCarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataUrl(file, async (dataUrl) => {
      activeVehicle.setCarImagePreview(dataUrl)
      try {
        const compressed = await compressImageDataUrl(dataUrl)
        activeVehicle.setCarImageDataUrl(compressed)
        activeVehicle.setCarImagePreview(compressed)
      } catch {
        activeVehicle.setCarImageDataUrl(dataUrl)
      }
    })
  }

  function handleCustomBackgroundFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataUrl(file, async (dataUrl) => {
      setCustomBackgroundImagePreview(dataUrl)
      bgGen.setCustomBackgroundError('')
      activeDesign.setSelectedPresetId(CUSTOM_BACKGROUND_NEW)
      if (!customBackgroundValue.trim()) setCustomBackgroundValue('Use this image as reference')
      try {
        const compressed = await compressImageDataUrl(dataUrl)
        setCustomBackgroundImageDataUrl(compressed)
        setCustomBackgroundImagePreview(compressed)
      } catch {
        setCustomBackgroundImageDataUrl(dataUrl)
      }
    })
  }

  // ---- Reset ----
  function reset() {
    try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    try {
      sessionStorage.removeItem(PENDING_GENERATION_KEY_FRONT)
      sessionStorage.removeItem(PENDING_GENERATION_KEY_BACK)
      sessionStorage.removeItem(PENDING_BACKGROUND_KEY)
    } catch { /* ignore */ }
    if (carFileRef.current) carFileRef.current.value = ''
    if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
    setCustomBackgroundImageDataUrl(null); setCustomBackgroundImagePreview(null)
    setCustomBackgroundValue('')
    setIsVehicleTweakOpen(false); setIsBackgroundTweakOpen(false)
    frontDesign.reset()
    backDesign.reset()
    frontVehicle.reset()
    backVehicle.reset()
    setSelectedSide('front')
    setBackEnabled(false)
    bgGen.resetBackgroundGeneration()
  }

  // ---- Side switch helpers ----
  function selectSide(side: PrintSide) {
    if (side === 'back' && !backEnabled) setBackEnabled(true)
    setSelectedSide(side)
  }

  function handleMobileDockTouchStart(e: React.TouchEvent<HTMLButtonElement>) {
    mobileDockTouchStartXRef.current = e.changedTouches[0]?.clientX ?? null
    mobileDockDidSwipeRef.current = false
  }

  function handleMobileDockTouchEnd(e: React.TouchEvent<HTMLButtonElement>) {
    const startX = mobileDockTouchStartXRef.current
    const endX = e.changedTouches[0]?.clientX
    mobileDockTouchStartXRef.current = null
    if (startX == null || endX == null) return
    const deltaX = endX - startX
    if (deltaX > 40) {
      setMobileDockDismissed(true)
      mobileDockDidSwipeRef.current = true
    }
  }

  function handleMobileDockEdgeTouchStart(e: React.TouchEvent<HTMLButtonElement>) {
    mobileDockTouchStartXRef.current = e.changedTouches[0]?.clientX ?? null
  }

  function handleMobileDockEdgeTouchEnd(e: React.TouchEvent<HTMLButtonElement>) {
    const startX = mobileDockTouchStartXRef.current
    const endX = e.changedTouches[0]?.clientX
    mobileDockTouchStartXRef.current = null
    if (startX == null || endX == null) return
    const deltaX = endX - startX
    if (deltaX < -25) {
      setMobileDockDismissed(false)
    }
  }

  const anyRevisions = frontVehicle.carGen.revisions.length > 0 || backVehicle.carGen.revisions.length > 0

  // ---- JSX ----
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Customizer</h1>
          </div>
          {anyRevisions && (
            <button type="button" className={styles.btnNewProject} onClick={reset}>
              Start Fresh
            </button>
          )}
        </div>
        <p className={styles.sessionHint}>
          Drop your photo and we&apos;ll create a custom illustration of your ride
        </p>
      </div>

      {/* Front / Back side tabs - always visible so the user picks a side first */}
      <div className="flex items-center gap-1 mt-2 mb-3">
        <button
          type="button"
          onClick={() => selectSide('front')}
          className={`px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border transition ${
            selectedSide === 'front'
              ? 'border-ignition bg-ignition/10 text-white'
              : 'border-border text-muted hover:border-white/30 hover:text-white'
          }`}
        >
          Front design
        </button>
        <button
          type="button"
          onClick={() => selectSide('back')}
          className={`px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border transition ${
            selectedSide === 'back'
              ? 'border-ignition bg-ignition/10 text-white'
              : 'border-border text-muted hover:border-white/30 hover:text-white'
          }`}
        >
          Back design{backEnabled ? '' : ' +'}
        </button>
      </div>

      <VehicleInputForm
        customerNotes={activeVehicle.customerNotes}
        setCustomerNotes={activeVehicle.setCustomerNotes}
        carImagePreview={activeVehicle.carImagePreview}
        vehicleLocked={activeVehicle.vehicleLocked}
        running={activeCarGen.running} canRun={canRun} isDone={isDone}
        revCount={activeCarGen.revisions.length}
        onUploadClick={() => carFileRef.current?.click()}
        onRemoveCarImage={() => {
          activeVehicle.setCarImageDataUrl(null)
          activeVehicle.setCarImagePreview(null)
          if (carFileRef.current) carFileRef.current.value = ''
        }}
        onGenerate={activeCarGen.runGeneration}
        onCancel={activeCarGen.cancelCarGeneration}
        onReset={reset}
      />
      <input ref={carFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCarFile} />

      {showResults && (
        <div className={styles.results}>
          {activeCarGen.revisions.length > 1 && (
            <>
              <h2 className={styles.resultsTitle}>Result</h2>
              <div className={styles.tweakHistoryRow}>
                {activeCarGen.revisions.map((rev, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.tweakHistoryItem} ${activeCarGen.viewIndex === idx ? styles.tweakHistoryItemActive : ''}`}
                    onClick={() => activeCarGen.setViewIndex(idx)}
                    disabled={activeCarGen.running}
                    title={rev.label}
                  >
                    <img src={rev.url} alt={rev.label} className={styles.tweakHistoryThumb} />
                    <span className={styles.tweakHistoryLabel}>{rev.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <div ref={composite.resultCardRef}>
            {(activeVehicle.vehicleLocked || editorsAvailable) && (
              <div>
                {activeVehicle.vehicleLocked && (
                  <div className={styles.tweakPanel}>
                    <CollapsibleTweak
                      label="Refine or fix the artwork"
                      isOpen={isVehicleTweakOpen}
                      onToggle={() => setIsVehicleTweakOpen((v) => !v)}
                    >
                      <div className={styles.setupBlock}>
                        <textarea className={styles.textarea} rows={4} placeholder="Add more detail, or fix any issues with the illustration." value={activeVehicle.tweakNotes} onChange={(e) => activeVehicle.setTweakNotes(e.target.value)} />
                      </div>
                      <div className={styles.tweakPanelActions}>
                        <button className={styles.btnPrimary} onClick={activeCarGen.runGeneration} disabled={!canRun}>
                          {activeCarGen.running ? 'Generating…' : 'Tweak'}
                        </button>
                        {activeCarGen.running && (
                          <button type="button" className={styles.btn} onClick={activeCarGen.cancelCarGeneration}>Cancel request</button>
                        )}
                      </div>
                    </CollapsibleTweak>
                      <div className={styles.nextHint}>
                        <span className="font-bold text-lg">Choose a background below</span>
                        <span aria-hidden className={styles.nextHintArrow}>↓</span>
                      </div>
                  </div>
                )}

                {editorsAvailable && (
                  <>
                    <BackgroundPresets
                      selectedPresetId={activeDesign.selectedPresetId}
                      setSelectedPresetId={activeDesign.setSelectedPresetId}
                      savedCustomBackgrounds={bgGen.savedCustomBackgrounds}
                      transparentCarUrl={transparentCarUrlForPreset}
                      backgroundControlsLocked={backgroundControlsLocked}
                      customBackgroundGenerating={bgGen.customBackgroundGenerating}
                      customBackgroundElapsed={bgGen.customBackgroundElapsed}
                      onCancelBackgroundGeneration={bgGen.cancelBackgroundGeneration}
                      showCustomPanel={showCustomPanel}
                      customBackgroundImagePreview={customBackgroundImagePreview}
                      customBackgroundValue={customBackgroundValue}
                      setCustomBackgroundValue={setCustomBackgroundValue}
                      canGenerateCustomBackground={canGenerateCustomBackground}
                      onCustomBackgroundUploadClick={() => customBackgroundFileRef.current?.click()}
                      onRunCustomBackgroundGeneration={bgGen.runCustomBackgroundGeneration}
                      customBackgroundError={bgGen.customBackgroundError}
                      isCustomSavedSelection={isCustomSavedSelection}
                      selectedCustomBg={selectedCustomBg}
                      isBackgroundTweakOpen={isBackgroundTweakOpen}
                      setIsBackgroundTweakOpen={setIsBackgroundTweakOpen}
                      backgroundTweakNotes={bgGen.backgroundTweakNotes}
                      setBackgroundTweakNotes={bgGen.setBackgroundTweakNotes}
                      customBackgroundRemoving={bgGen.customBackgroundRemoving}
                      onRunBackgroundTweak={() => bgGen.runBackgroundTweak(selectedCustomBg)}
                      onResetCustomPanel={() => {
                        setCustomBackgroundImageDataUrl(null)
                        setCustomBackgroundImagePreview(null)
                        setCustomBackgroundValue('')
                        bgGen.setCustomBackgroundError('')
                        if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
                        activeDesign.setSelectedPresetId(CUSTOM_BACKGROUND_NEW)
                      }}
                      onRemoveCustomImage={() => {
                        setCustomBackgroundImageDataUrl(null)
                        setCustomBackgroundImagePreview(null)
                        bgGen.setCustomBackgroundError('')
                        if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
                      }}
                    />
                    <input ref={customBackgroundFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCustomBackgroundFile} disabled={backgroundControlsLocked} />

                    {transparentCarUrlForPreset && (
                      <CompositeEditor
                        carAdjustYPct={activeDesign.carAdjustYPct} setCarAdjustYPct={activeDesign.setCarAdjustYPct}
                        carScale={activeDesign.carScale} setCarScale={activeDesign.setCarScale}
                        bgScale={activeDesign.bgScale} setBgScale={activeDesign.setBgScale}
                        setCompositionZoom={activeDesign.setCompositionZoom}
                        setCarAdjustXPct={activeDesign.setCarAdjustXPct}
                        backgroundControlsLocked={backgroundControlsLocked}
                      />
                    )}
                    <TextLayerEditor
                      textLayers={activeDesign.text.textLayers}
                      selectedTextLayerId={activeDesign.text.selectedTextLayerId}
                      setSelectedTextLayerId={activeDesign.text.setSelectedTextLayerId}
                      selectedTextLayer={activeDesign.text.selectedTextLayer}
                      availableFontOptions={availableFontOptions}
                      backgroundControlsLocked={backgroundControlsLocked}
                      onAddTextLayer={activeDesign.text.addTextLayer}
                      onUpdateTextLayer={activeDesign.text.updateTextLayer}
                      onRemoveTextLayer={activeDesign.text.removeTextLayer}
                      onMoveTextLayer={activeDesign.text.moveTextLayer}
                      onNudgeTextFontSize={activeDesign.text.nudgeTextFontSize}
                      onAlignTextLayerToCanvasVertical={activeDesign.text.alignTextLayerToCanvasVertical}
                    />
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
          className={`${styles.mobileResultDock} ${composite.showMobileResultDock && !mobileDockDismissed ? styles.mobileResultDockVisible : ''}`}
          onClick={() => {
            if (mobileDockDidSwipeRef.current) {
              mobileDockDidSwipeRef.current = false
              return
            }
            setShowPreviewModal(true)
          }}
          onTouchStart={handleMobileDockTouchStart}
          onTouchEnd={handleMobileDockTouchEnd}
          aria-label="Open mockup preview"
          aria-hidden={!composite.showMobileResultDock || mobileDockDismissed}
          tabIndex={composite.showMobileResultDock && !mobileDockDismissed ? 0 : -1}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mobileResultDockSrc} alt="" />
        </button>
      )}

      {!!mobileResultDockSrc && composite.showMobileResultDock && mobileDockDismissed && (
        <button
          type="button"
          className={styles.mobileResultDockEdgeHandle}
          onClick={() => setMobileDockDismissed(false)}
          onTouchStart={handleMobileDockEdgeTouchStart}
          onTouchEnd={handleMobileDockEdgeTouchEnd}
          aria-label="Show preview dock"
        >
          <span aria-hidden>❮</span>
        </button>
      )}

      <MockupPreviewModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />

      {composite.renderHiddenCanvas()}
    </main>
  )
}
