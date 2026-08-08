'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'
import styles from './styles'
import {
  SESSION_KEY,
  PENDING_GENERATION_KEY,
  PENDING_BACKGROUND_KEY,
  BACKGROUND_PRESETS,
  CUSTOM_BACKGROUND_NEW,
  CUSTOM_BACKGROUND_PREFIX,
  TEXT_FONTS,
  resolveCornerLogoPresetSrc,
  resolveDesignerPlaceholderUrl,
  isRealBackgroundUrl,
  LOGO_CORNER_PRESETS,
} from './constants'
import {
  readFileAsDataUrl,
  compressImageDataUrl,
  fetchUrlAsDataUrl,
  getPrintZoneCornerTextPosition,
  createPrintZoneCornerImage,
  clampCornerImageSizePct,
} from './helpers'
import type { FontOption, PrintZoneCorner, PrintZoneCornerImage } from './types'

import VehicleInputForm from './VehicleInputForm'
import BackgroundPresets from './BackgroundPresets'
import CompositeEditor from './CompositeEditor'
import TextLayerEditor from './TextLayerEditor'
import TextOverlayToggle from './TextOverlayToggle'
import TextPlacementSelector from './TextPlacementSelector'
import ArtworkPositionSelector from './ArtworkPositionSelector'
import DownloadArtworkSection from './DownloadArtworkSection'
import TestArtworkDownload from './TestArtworkDownload'
import DesignerYesNoSection from './DesignerYesNoSection'
import MockupPreviewModal from './MockupPreviewModal'
import CollapsibleTweak from './parts/CollapsibleTweak'
import WhiteGapEraser from './WhiteGapEraser'

import { useCustomizer } from './CustomizerContext'
import { useTextLayers } from '@/hooks/useTextLayers'
import { useCarGeneration } from '@/hooks/useCarGeneration'
import { useBackgroundGeneration } from '@/hooks/useBackgroundGeneration'
import { useCompositeCanvas } from '@/hooks/useCompositeCanvas'
import { useSession } from '@/hooks/useSession'
import {
  formatDesignerSourceFilesPrice,
  formatDesignerPriorityPrice,
} from '@/lib/shop/designerAddons'

export default function ProductCustomizer() {
  const {
    mockupThumbnailUrl,
    artworkSide,
    setArtworkSide,
    textPlacement,
    setTextPlacement,
    artworkUrl,
    setArtworkUrl,
    compositeDataUrl,
    artworkOnlyDataUrl,
    setArtworkOnlyDataUrl,
    textOnlyDataUrl,
    setTextOnlyDataUrl,
    cornersOnlyDataUrl,
    setCornersOnlyDataUrl,
    setCompositeDataUrl,
    setGenerationStatus,
    productType,
    mockupPlacement,
    mockupBaseNaturalWidth,
    mockupBaseNaturalHeight,
    selectedColorTitle,
    downloadArtworkEnabled,
    setDownloadArtworkEnabled,
    setArtworkHasExtras,
    illustrationMode,
    setIllustrationMode,
    setCustomerPhotoDataUrl,
    setCustomerNotes: setContextCustomerNotes,
    setDesignerBackgroundUrl,
    setDesignerRequestedText,
    setDesignerTextCorner,
    setDesignerCornerImageUrl,
    setDesignerCornerImageLabel,
    aiArtworkUrl,
    setAiArtworkUrl,
    designerIncludeSourceFiles,
    setDesignerIncludeSourceFiles,
    designerPriority,
    setDesignerPriority,
  } = useCustomizer()

  // ---- Vehicle input state (owned by this component) ----
  const [customerNotes, setCustomerNotes] = useState('')
  const [carImageDataUrl, setCarImageDataUrl] = useState<string | null>(null)
  const [carImagePreview, setCarImagePreview] = useState<string | null>(null)
  const [vehicleLocked, setVehicleLocked] = useState(false)
  const [composedPromptNotes, setComposedPromptNotes] = useState('')
  const [tweakNotes, setTweakNotes] = useState('')

  // ---- Background selection state ----
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [customBackgroundImageDataUrl, setCustomBackgroundImageDataUrl] = useState<string | null>(null)
  const [customBackgroundImagePreview, setCustomBackgroundImagePreview] = useState<string | null>(null)
  const [customBackgroundValue, setCustomBackgroundValue] = useState('')
  const [isVehicleTweakOpen, setIsVehicleTweakOpen] = useState(false)
  const [isDesignerHandoffOpen, setIsDesignerHandoffOpen] = useState(false)
  const [isBackgroundTweakOpen, setIsBackgroundTweakOpen] = useState(false)
  const [isErasingArtwork, setIsErasingArtwork] = useState(false)

  // ---- Composite position state ----
  const [carAdjustXPct, setCarAdjustXPct] = useState(0)
  const [carAdjustYPct, setCarAdjustYPct] = useState(0)
  const [carScale, setCarScale] = useState(1)
  const [compositionZoom, setCompositionZoom] = useState(1)
  const [bgScale, setBgScale] = useState(1)

  // ---- UI state ----
  const [desktopDragEnabled, setDesktopDragEnabled] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [mobileDockDismissed, setMobileDockDismissed] = useState(false)
  const [adjustCompositionInView, setAdjustCompositionInView] = useState(false)
  const [customFontOptions, setCustomFontOptions] = useState<FontOption[]>([])
  const [addTextEnabled, setAddTextEnabled] = useState(false)
  const [printZoneCornerImage, setPrintZoneCornerImage] = useState<PrintZoneCornerImage>(() => createPrintZoneCornerImage())
  const carFileRef = useRef<HTMLInputElement>(null)
  const illustrationFileRef = useRef<HTMLInputElement>(null)
  const customBackgroundFileRef = useRef<HTMLInputElement>(null)
  const cornerImageFileRef = useRef<HTMLInputElement>(null)
  const loadedCustomFontFamiliesRef = useRef(new Set<string>())
  const mobileDockTouchStartXRef = useRef<number | null>(null)
  const mobileDockDidSwipeRef = useRef(false)

  const availableFontOptions = customFontOptions.length > 0 ? customFontOptions : TEXT_FONTS

  // ---- Hooks ----
  const textLayerHook = useTextLayers(availableFontOptions)

  const carGen = useCarGeneration({
    carImageDataUrl, customerNotes,
    vehicleLocked, setVehicleLocked, composedPromptNotes, setComposedPromptNotes,
    tweakNotes, setTweakNotes,
  })

  const bgGen = useBackgroundGeneration({
    customBackgroundImageDataUrl, customBackgroundValue,
    setCustomBackgroundImageDataUrl, setCustomBackgroundImagePreview,
    setCustomBackgroundValue, setSelectedPresetId, customBackgroundFileRef,
  })

  // ---- Derived state ----
  const baseReady = !!carImageDataUrl && !carGen.running
  const canRun = vehicleLocked ? baseReady && !!tweakNotes.trim() : baseReady
  const isRunning = carGen.status === 'running'
  const isDone = carGen.status === 'done'
  const isDesignerMode = illustrationMode === 'designer'
  const showResults =
    !isDesignerMode &&
    (isRunning || carGen.status.startsWith('error') || carGen.revisions.length > 0)
  const viewingUrl = carGen.revisions.length > 0 ? carGen.revisions[carGen.viewIndex]?.url : null
  const hasTransparentRevision = carGen.revisions.some((r) => r.transparent)

  useEffect(() => {
    setContextCustomerNotes(customerNotes)
  }, [customerNotes, setContextCustomerNotes])

  useEffect(() => {
    setCustomerPhotoDataUrl(carImageDataUrl)
  }, [carImageDataUrl, setCustomerPhotoDataUrl])

  useEffect(() => {
    if (productType !== 'mug') return
    setArtworkSide('front')
    setTextPlacement('same')
  }, [productType, setArtworkSide, setTextPlacement])

  useEffect(() => {
    if (illustrationMode !== 'designer') return
    setArtworkUrl(resolveDesignerPlaceholderUrl(selectedColorTitle))
    setGenerationStatus('done')
    if (!vehicleLocked) setVehicleLocked(true)
  }, [illustrationMode, vehicleLocked, selectedColorTitle, setArtworkUrl, setGenerationStatus])

  useEffect(() => {
    if (vehicleLocked && illustrationMode === null && carGen.revisions.length === 0 && !carGen.running) {
      setVehicleLocked(false)
    }
  }, [vehicleLocked, illustrationMode, carGen.revisions.length, carGen.running])

  useEffect(() => {
    if (illustrationMode === 'ai' || carGen.revisions.length > 0 || carGen.running) {
      if (illustrationMode !== 'ai' && illustrationMode !== 'designer') {
        setIllustrationMode('ai')
      }
    }
  }, [carGen.revisions.length, carGen.running, illustrationMode, setIllustrationMode])

  const transparentCarUrlForPreset = useMemo(() => {
    const cur = carGen.revisions[carGen.viewIndex]
    if (cur?.transparent) return cur.url
    for (let i = carGen.revisions.length - 1; i >= 0; i--) {
      if (carGen.revisions[i].transparent) return carGen.revisions[i].url
    }
    return null
  }, [carGen.revisions, carGen.viewIndex])

  const selectedPreset = BACKGROUND_PRESETS.find((p) => p.id === selectedPresetId)
  const isCustomSavedSelection =
    typeof selectedPresetId === 'string' &&
    selectedPresetId.startsWith(CUSTOM_BACKGROUND_PREFIX) &&
    selectedPresetId !== CUSTOM_BACKGROUND_NEW
  const selectedCustomBg = isCustomSavedSelection ? bgGen.savedCustomBackgrounds.find((bg) => bg.id === selectedPresetId) ?? null : null
  const selectedBackgroundSrc = isCustomSavedSelection ? selectedCustomBg?.resultUrl ?? null : selectedPreset?.src ?? null
  const selectedBackgroundIsCustom = isCustomSavedSelection
  const showCustomPanel = selectedPresetId === CUSTOM_BACKGROUND_NEW
  const backgroundControlsLocked = bgGen.customBackgroundGenerating
  const canGenerateCustomBackground = !!customBackgroundValue.trim() && !bgGen.customBackgroundGenerating && !bgGen.customBackgroundRemoving

  useEffect(() => {
    if (!isDesignerMode) {
      setDesignerBackgroundUrl(null)
      return
    }
    setDesignerBackgroundUrl(
      isRealBackgroundUrl(selectedBackgroundSrc) ? selectedBackgroundSrc : null
    )
  }, [isDesignerMode, selectedBackgroundSrc, setDesignerBackgroundUrl])

  useEffect(() => {
    if (!isDesignerMode) return
    if (!addTextEnabled) {
      setDesignerRequestedText('')
      setDesignerTextCorner(null)
      return
    }
    const texts = textLayerHook.textLayers
      .map((layer) => layer.text.trim())
      .filter(Boolean)
    setDesignerRequestedText(texts.join('\n'))

    const corners: string[] = []
    for (const layer of textLayerHook.textLayers) {
      if (!layer.printZoneCorner) continue
      corners.push(layer.printZoneCorner)
    }
    setDesignerTextCorner(corners.length ? corners.join('; ') : null)
  }, [
    isDesignerMode,
    addTextEnabled,
    textLayerHook.textLayers,
    setDesignerRequestedText,
    setDesignerTextCorner,
  ])

  useEffect(() => {
    if (!isDesignerMode) {
      setDesignerCornerImageUrl(null)
      setDesignerCornerImageLabel(null)
      return
    }
    if (
      !addTextEnabled ||
      !printZoneCornerImage.enabled ||
      !printZoneCornerImage.src
    ) {
      setDesignerCornerImageUrl(null)
      setDesignerCornerImageLabel(null)
      return
    }
    setDesignerCornerImageUrl(printZoneCornerImage.src)
    const presetLabel = printZoneCornerImage.presetId
      ? LOGO_CORNER_PRESETS.find((p) => p.id === printZoneCornerImage.presetId)?.label
      : null
    const source = presetLabel
      ? `${presetLabel} preset`
      : 'Uploaded image'
    setDesignerCornerImageLabel(`${source} @ ${printZoneCornerImage.corner}`)
  }, [
    isDesignerMode,
    addTextEnabled,
    printZoneCornerImage.enabled,
    printZoneCornerImage.src,
    printZoneCornerImage.presetId,
    printZoneCornerImage.corner,
    setDesignerCornerImageUrl,
    setDesignerCornerImageLabel,
  ])

  useLayoutEffect(() => {
    const hasBackground = !!selectedBackgroundSrc
    const hasText =
      addTextEnabled &&
      textLayerHook.textLayers.some((layer) => layer.text.trim().length > 0)
    const hasCornerText =
      addTextEnabled &&
      textLayerHook.textLayers.some((layer) => !!layer.printZoneCorner)
    const hasCornerImage =
      !!printZoneCornerImage.enabled &&
      (!!printZoneCornerImage.src || !!printZoneCornerImage.presetId)
    setArtworkHasExtras(hasBackground || hasText || hasCornerText || hasCornerImage)
  }, [
    selectedBackgroundSrc,
    addTextEnabled,
    textLayerHook.textLayers,
    printZoneCornerImage.enabled,
    printZoneCornerImage.src,
    printZoneCornerImage.presetId,
    setArtworkHasExtras,
  ])

  const composite = useCompositeCanvas({
    transparentCarUrlForPreset: isDesignerMode ? null : transparentCarUrlForPreset,
    selectedBackgroundSrc, selectedBackgroundIsCustom,
    selectedPreset, isCustomSavedSelection, selectedCustomBg,
    carAdjustXPct, setCarAdjustXPct, carAdjustYPct, setCarAdjustYPct,
    carScale, compositionZoom, setCompositionZoom, bgScale,
    textLayersRef: textLayerHook.textLayersRef, textLayers: textLayerHook.textLayers,
    selectedTextLayerId: textLayerHook.selectedTextLayerId,
    updateTextLayer: textLayerHook.updateTextLayer,
    backgroundControlsLocked, showResults, desktopDragEnabled,
    textPlacement, artworkSide, productType, mockupPlacement,
    mockupBaseNaturalWidth, mockupBaseNaturalHeight,
    printZoneCornerImage,
  })

  function getPrintZoneCornerPosition(corner: PrintZoneCorner) {
    const width = 2048
    const height = width + Math.ceil(width * 0.22)
    const side = textPlacement === 'opposite'
      ? (artworkSide === 'front' ? 'back' : 'front')
      : artworkSide
    return getPrintZoneCornerTextPosition(width, height, corner, {
      productType,
      side,
      placement: mockupPlacement,
      mockupBaseNaturalWidth,
      mockupBaseNaturalHeight,
    })
  }

  const mobileResultDockSrc = mockupThumbnailUrl || viewingUrl
  const forceDockForComposition = adjustCompositionInView
  const mobileDockVisible =
    !!mobileResultDockSrc &&
    (forceDockForComposition || (composite.showMobileResultDock && !mobileDockDismissed))

  const handleAdjustCompositionInView = useCallback((inView: boolean) => {
    setAdjustCompositionInView(inView)
  }, [])

  // ---- Session ----
  const { sessionRestored } = useSession(
    {
      customerNotes,
      carImageDataUrl, carImagePreview,
      revisions: carGen.revisions, viewIndex: carGen.viewIndex,
      vehicleLocked, composedPromptNotes, tweakNotes, selectedPresetId,
      savedCustomBackgrounds: bgGen.savedCustomBackgrounds,
      customBackgroundImageDataUrl, customBackgroundImagePreview, customBackgroundValue,
      carAdjustXPct, carAdjustYPct, carScale, compositionZoom, bgScale,
      textLayers: textLayerHook.textLayers, selectedTextLayerId: textLayerHook.selectedTextLayerId,
      printZoneCornerImage,
      artworkSide,
      addTextEnabled,
      textPlacement,
      illustrationMode,
      aiArtworkUrl,
      designerIncludeSourceFiles,
      designerPriority,
    },
    {
      setCustomerNotes,
      setCarImageDataUrl, setCarImagePreview,
      setRevisions: carGen.setRevisions, setViewIndex: carGen.setViewIndex,
      setVehicleLocked, setComposedPromptNotes, setTweakNotes, setSelectedPresetId,
      setSavedCustomBackgrounds: bgGen.setSavedCustomBackgrounds,
      setCustomBackgroundImageDataUrl, setCustomBackgroundImagePreview, setCustomBackgroundValue,
      setCarAdjustXPct, setCarAdjustYPct, setCarScale, setCompositionZoom, setBgScale,
      setTextLayers: textLayerHook.setTextLayers, setSelectedTextLayerId: textLayerHook.setSelectedTextLayerId,
      setPrintZoneCornerImage,
      setArtworkSide,
      setAddTextEnabled,
      setTextPlacement,
      setIllustrationMode,
      setAiArtworkUrl,
      setDesignerIncludeSourceFiles,
      setDesignerPriority,
      setStatus: carGen.setStatus,
      resumePendingGeneration: carGen.resumePendingGeneration,
      resumePendingBackgroundGeneration: bgGen.resumePendingBackgroundGeneration,
    }
  )

  useEffect(() => {
    if (!sessionRestored) return
    if (addTextEnabled && textLayerHook.textLayers.length === 0) {
      textLayerHook.addTextLayer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionRestored])

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
    textLayerHook.setTextLayers((prev) => {
      let changed = false
      const next = prev.map((layer) => {
        if (allowed.has(layer.fontFamily)) return layer
        changed = true
        return { ...layer, fontFamily: availableFontOptions[0].value }
      })
      return changed ? next : prev
    })
  }, [customFontOptions, availableFontOptions, textLayerHook])

  useEffect(() => {
    if (!textLayerHook.selectedTextLayerId) return
    if (textLayerHook.textLayers.some((l) => l.id === textLayerHook.selectedTextLayerId)) return
    textLayerHook.setSelectedTextLayerId(textLayerHook.textLayers[0]?.id ?? null)
  }, [textLayerHook])

  // ---- File handlers ----
  function handleCarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
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

  async function handleCarImageUrl(url: string) {
    const dataUrl = await fetchUrlAsDataUrl(url)
    setCarImagePreview(dataUrl)
    try {
      const compressed = await compressImageDataUrl(dataUrl)
      setCarImageDataUrl(compressed)
      setCarImagePreview(compressed)
    } catch {
      setCarImageDataUrl(dataUrl)
    }
  }

  function handleIllustrationFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || vehicleLocked || carGen.running) return
    readFileAsDataUrl(file, async (dataUrl) => {
      setIllustrationMode('ai')
      await carGen.seedIllustrationFromUrl(dataUrl)
    })
  }

  function handleCustomBackgroundFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataUrl(file, async (dataUrl) => {
      setCustomBackgroundImagePreview(dataUrl)
      bgGen.setCustomBackgroundError('')
      setSelectedPresetId(CUSTOM_BACKGROUND_NEW)
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

  function updatePrintZoneCornerImage(patch: Partial<PrintZoneCornerImage>) {
    setPrintZoneCornerImage((prev) => ({
      ...prev,
      ...patch,
      sizePct: typeof patch.sizePct === 'number'
        ? clampCornerImageSizePct(patch.sizePct)
        : prev.sizePct,
    }))
  }

  function handleCornerImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readFileAsDataUrl(file, (dataUrl) => {
      updatePrintZoneCornerImage({
        enabled: true,
        src: dataUrl,
        presetId: null,
      })
    })
  }

  function applyCornerPreset(presetId: string) {
    const src = resolveCornerLogoPresetSrc(presetId, selectedColorTitle)
    if (!src) return
    updatePrintZoneCornerImage({ enabled: true, src, presetId })
  }

  useEffect(() => {
    setPrintZoneCornerImage((prev) => {
      const id = prev.presetId
      if (!id || !prev.enabled) return prev
      const next = resolveCornerLogoPresetSrc(id, selectedColorTitle)
      if (!next || next === prev.src) return prev
      return { ...prev, src: next }
    })
  }, [selectedColorTitle, printZoneCornerImage.presetId, printZoneCornerImage.enabled])

  function removePrintZoneCornerImage() {
    setPrintZoneCornerImage((prev) => ({
      ...prev,
      src: null,
      presetId: null,
    }))
    if (cornerImageFileRef.current) cornerImageFileRef.current.value = ''
  }

  function handleAddTextToggle(enabled: boolean) {
    setAddTextEnabled(enabled)
    if (enabled) {
      if (textLayerHook.textLayers.length === 0) textLayerHook.addTextLayer()
    } else {
      textLayerHook.resetTextLayers()
      // Without text there is nothing to place; revert so toggling back ON
      // starts from the safe default.
      setTextPlacement('same')
      setPrintZoneCornerImage(createPrintZoneCornerImage())
    }
  }

  // ---- Reset ----
  function reset() {
    try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    try { sessionStorage.removeItem(PENDING_GENERATION_KEY); sessionStorage.removeItem(PENDING_BACKGROUND_KEY) } catch { /* ignore */ }
    if (carFileRef.current) carFileRef.current.value = ''
    if (illustrationFileRef.current) illustrationFileRef.current.value = ''
    if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
    if (cornerImageFileRef.current) cornerImageFileRef.current.value = ''
    setCustomerNotes('')
    setCarImageDataUrl(null); setCarImagePreview(null)
    setCustomerPhotoDataUrl(null)
    setContextCustomerNotes('')
    setVehicleLocked(false); setComposedPromptNotes(''); setTweakNotes('')
    setSelectedPresetId(null)
    setCustomBackgroundImageDataUrl(null); setCustomBackgroundImagePreview(null)
    setCustomBackgroundValue('')
    setIsVehicleTweakOpen(false); setIsBackgroundTweakOpen(false)
    setIsDesignerHandoffOpen(false)
    setCarAdjustXPct(0); setCarAdjustYPct(0); setCarScale(1); setCompositionZoom(1); setBgScale(1)
    setArtworkSide('front')
    setAddTextEnabled(false)
    setPrintZoneCornerImage(createPrintZoneCornerImage())
    setTextPlacement('same')
    setDownloadArtworkEnabled(false)
    setArtworkHasExtras(false)
    setArtworkOnlyDataUrl(null)
    setTextOnlyDataUrl(null)
    setArtworkUrl(null)
    setGenerationStatus('idle')
    setIllustrationMode(null)
    setDesignerRequestedText('')
    setDesignerTextCorner(null)
    setDesignerBackgroundUrl(null)
    setDesignerCornerImageUrl(null)
    setDesignerCornerImageLabel(null)
    setAiArtworkUrl(null)
    setDesignerIncludeSourceFiles(false)
    setDesignerPriority(false)
    carGen.resetCarGeneration()
    bgGen.resetBackgroundGeneration()
    textLayerHook.resetTextLayers()
  }

  function handleChooseAi() {
    if (!canRun || isDesignerMode) return
    setIllustrationMode('ai')
    carGen.runGeneration()
  }

  function handleChooseDesigner() {
    if (!canRun || carGen.running || illustrationMode === 'ai') return
    setIllustrationMode('designer')
    setAiArtworkUrl(null)
    setDesignerIncludeSourceFiles(false)
    setDesignerPriority(false)
    setVehicleLocked(true)
    setArtworkUrl(resolveDesignerPlaceholderUrl(selectedColorTitle))
    setGenerationStatus('done')
    setArtworkOnlyDataUrl(null)
    setTextOnlyDataUrl(null)
    setDownloadArtworkEnabled(false)
    setArtworkHasExtras(false)
  }

  function handleSwitchToAi() {
    if (carGen.running || !carImageDataUrl) return

    if (carGen.revisions.length > 0) {
      setIllustrationMode('ai')
      setAiArtworkUrl(null)
      setDesignerIncludeSourceFiles(false)
      setDesignerPriority(false)
      setVehicleLocked(true)
      setGenerationStatus('done')
      setIsDesignerHandoffOpen(false)
      return
    }

    setIllustrationMode('ai')
    setAiArtworkUrl(null)
    setDesignerIncludeSourceFiles(false)
    setDesignerPriority(false)
    setVehicleLocked(false)
    setArtworkUrl(null)
    setGenerationStatus('idle')
    setArtworkOnlyDataUrl(null)
    setTextOnlyDataUrl(null)
    setDesignerBackgroundUrl(null)
    setDesignerRequestedText('')
    setDesignerTextCorner(null)
    setDesignerCornerImageUrl(null)
    setDesignerCornerImageLabel(null)
    setAddTextEnabled(false)
    setTextPlacement('same')
    setPrintZoneCornerImage(createPrintZoneCornerImage())
    textLayerHook.resetTextLayers()
    setSelectedPresetId(null)
    carGen.runGeneration()
  }

  function handleSwitchToDesigner() {
    if (carGen.running || !viewingUrl) return
    const carOnlyUrl =
      artworkOnlyDataUrl || transparentCarUrlForPreset || viewingUrl
    setAiArtworkUrl(carOnlyUrl)
    if (tweakNotes.trim()) {
      const changeNote = tweakNotes.trim()
      setCustomerNotes((prev) =>
        prev.trim()
          ? `${prev.trim()}\n\nWhat to change: ${changeNote}`
          : `What to change: ${changeNote}`
      )
      setTweakNotes('')
    }
    setIllustrationMode('designer')
    setVehicleLocked(true)
    setArtworkUrl(resolveDesignerPlaceholderUrl(selectedColorTitle))
    setCompositeDataUrl(null)
    setArtworkOnlyDataUrl(null)
    setTextOnlyDataUrl(null)
    setCornersOnlyDataUrl(null)
    setGenerationStatus('done')
    setDownloadArtworkEnabled(false)
    setArtworkHasExtras(false)
    setIsVehicleTweakOpen(false)
    setIsDesignerHandoffOpen(false)
    setIsErasingArtwork(false)
  }

  function handleMobileDockTouchStart(e: React.TouchEvent<HTMLButtonElement>) {
    mobileDockTouchStartXRef.current = e.changedTouches[0]?.clientX ?? null
    mobileDockDidSwipeRef.current = false
  }

  function handleMobileDockTouchEnd(e: React.TouchEvent<HTMLButtonElement>) {
    if (forceDockForComposition) return
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

  // ---- JSX ----
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Customizer</h1>
          </div>
          {(vehicleLocked || illustrationMode != null || carGen.revisions.length > 0) && (
            <button type="button" className={styles.btnNewProject} onClick={reset}>
              Start Fresh
            </button>
          )}
        </div>
        <p className={styles.sessionHint}>
          {isDesignerMode
            ? 'Choose a background and any text you want. A designer will create your illustration in 2–3 days.'
            : "Drop your photo and we'll create a custom illustration of your ride — or request a designer."}
        </p>
      </div>

      <VehicleInputForm
        customerNotes={customerNotes} setCustomerNotes={setCustomerNotes}
        carImagePreview={carImagePreview} vehicleLocked={vehicleLocked}
        running={carGen.running} canRun={canRun} isDone={isDone}
        revCount={carGen.revisions.length}
        illustrationMode={illustrationMode}
        onUploadClick={() => carFileRef.current?.click()}
        onRemoveCarImage={() => {
          setCarImageDataUrl(null)
          setCarImagePreview(null)
          if (carFileRef.current) carFileRef.current.value = ''
        }}
        onLoadImageUrl={handleCarImageUrl}
        onGenerate={handleChooseAi}
        onChooseDesigner={handleChooseDesigner}
        onUploadIllustration={() => illustrationFileRef.current?.click()}
        onSwitchToAi={handleSwitchToAi}
        onCancel={carGen.cancelCarGeneration}
        onReset={reset}
      />
      <input ref={carFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCarFile} />
      <input ref={illustrationFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIllustrationFile} />

      {isDesignerMode && (
        <div className={styles.results}>
          <BackgroundPresets
            selectedPresetId={selectedPresetId} setSelectedPresetId={setSelectedPresetId}
            savedCustomBackgrounds={bgGen.savedCustomBackgrounds}
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
              setSelectedPresetId(CUSTOM_BACKGROUND_NEW)
            }}
            onRemoveCustomImage={() => {
              setCustomBackgroundImageDataUrl(null)
              setCustomBackgroundImagePreview(null)
              bgGen.setCustomBackgroundError('')
              if (customBackgroundFileRef.current) customBackgroundFileRef.current.value = ''
            }}
          />
          <input ref={customBackgroundFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCustomBackgroundFile} disabled={backgroundControlsLocked} />

          {productType !== 'mug' && (
            <ArtworkPositionSelector
              artworkSide={artworkSide}
              setArtworkSide={setArtworkSide}
              disabled={false}
            />
          )}
          <TextOverlayToggle
            enabled={addTextEnabled}
            onChange={handleAddTextToggle}
            disabled={false}
          />
          {addTextEnabled && productType !== 'mug' && (
            <TextPlacementSelector
              placement={textPlacement}
              onChange={setTextPlacement}
              disabled={false}
            />
          )}
          {addTextEnabled && (
            <TextLayerEditor
              textLayers={textLayerHook.textLayers}
              selectedTextLayerId={textLayerHook.selectedTextLayerId}
              setSelectedTextLayerId={textLayerHook.setSelectedTextLayerId}
              selectedTextLayer={textLayerHook.selectedTextLayer}
              availableFontOptions={availableFontOptions}
              backgroundControlsLocked={false}
              onAddTextLayer={textLayerHook.addTextLayer}
              onUpdateTextLayer={textLayerHook.updateTextLayer}
              onRemoveTextLayer={textLayerHook.removeTextLayer}
              onMoveTextLayer={textLayerHook.moveTextLayer}
              onNudgeTextFontSize={textLayerHook.nudgeTextFontSize}
              getPrintZoneCornerPosition={getPrintZoneCornerPosition}
              printZoneCornerImage={printZoneCornerImage}
              onUpdatePrintZoneCornerImage={updatePrintZoneCornerImage}
              onUploadCornerImage={() => cornerImageFileRef.current?.click()}
              onRemoveCornerImage={removePrintZoneCornerImage}
              garmentColorTitle={selectedColorTitle}
              onApplyCornerPreset={applyCornerPreset}
              designerMode
            />
          )}
          <DesignerYesNoSection
            title="Include Source Files?"
            ariaLabel="Include source files"
            intro={`Get editable source files with your finished illustration for ${formatDesignerSourceFilesPrice()}.`}
            enabled={designerIncludeSourceFiles}
            onChange={setDesignerIncludeSourceFiles}
          />
          <DesignerYesNoSection
            title="Priority"
            ariaLabel="Priority rush order"
            intro={`Rush order — have a designer finish in under 24 hours for ${formatDesignerPriorityPrice()}.`}
            enabled={designerPriority}
            onChange={setDesignerPriority}
          />
        </div>
      )}

      {showResults && (
        <div className={styles.results}>
          {carGen.revisions.length > 1 && (
            <>
              <h2 className={styles.resultsTitle}>Result</h2>
              <div className={styles.tweakHistoryRow}>
                {carGen.revisions.map((rev, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.tweakHistoryItem} ${carGen.viewIndex === idx ? styles.tweakHistoryItemActive : ''}`}
                    onClick={() => carGen.setViewIndex(idx)}
                    disabled={carGen.running}
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
            {(vehicleLocked || hasTransparentRevision) && (
              <div>
                {vehicleLocked && (
                  <div className={styles.tweakPanel}>
                    <div className={styles.tweakDropdownRow}>
                      <div className={styles.tweakDropdownCol}>
                        <CollapsibleTweak
                          label="Refine or fix the artwork"
                          isOpen={isVehicleTweakOpen}
                          onToggle={() => {
                            setIsVehicleTweakOpen((v) => !v)
                            setIsDesignerHandoffOpen(false)
                          }}
                        >
                          <div className={styles.setupBlock}>
                            <textarea className={styles.textarea} rows={4} placeholder="Add more detail, or fix any issues with the illustration." value={tweakNotes} onChange={(e) => setTweakNotes(e.target.value)} />
                          </div>
                          <div className={styles.tweakPanelActions}>
                            <button className={styles.btnPrimary} onClick={carGen.runGeneration} disabled={!canRun}>
                              {carGen.running ? 'Generating…' : 'Tweak'}
                            </button>
                            {!!viewingUrl && !carGen.running && (
                              <button
                                type="button"
                                className={styles.btn}
                                onClick={() => setIsErasingArtwork(true)}
                                title="Tap on white gaps in the artwork to make them transparent"
                              >
                                Erase white gaps
                              </button>
                            )}
                            {carGen.running && (
                              <button type="button" className={styles.btn} onClick={carGen.cancelCarGeneration}>Cancel request</button>
                            )}
                          </div>
                        </CollapsibleTweak>
                      </div>
                      {!!viewingUrl && !carGen.running && (
                        <div className={styles.tweakDropdownCol}>
                          <CollapsibleTweak
                            label="Prefer a designer?"
                            isOpen={isDesignerHandoffOpen}
                            onToggle={() => {
                              setIsDesignerHandoffOpen((v) => !v)
                              setIsVehicleTweakOpen(false)
                            }}
                          >
                            <div className={styles.designerHandoff}>
                              <p className={styles.hint}>
                                Want a hand-drawn finish or a few refinements from a profressional desginer? We&apos;ll use your photo and this artwork as reference. <br /> May take up to 1 - 3 days.
                              </p>
                              <button
                                type="button"
                                className={styles.btn}
                                onClick={handleSwitchToDesigner}
                              >
                                Send to our designer
                              </button>
                            </div>
                          </CollapsibleTweak>
                        </div>
                      )}
                    </div>
                    <div className={styles.nextHint}>
                      <span className="font-bold text-lg">Choose a background below</span>
                      <span aria-hidden className={styles.nextHintArrow}>↓</span>
                    </div>
                  </div>
                )}

                {hasTransparentRevision && (
                  <>
                    <BackgroundPresets
                      selectedPresetId={selectedPresetId} setSelectedPresetId={setSelectedPresetId}
                      savedCustomBackgrounds={bgGen.savedCustomBackgrounds}
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
                        setSelectedPresetId(CUSTOM_BACKGROUND_NEW)
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
                      <>
                        <CompositeEditor
                          carAdjustYPct={carAdjustYPct} setCarAdjustYPct={setCarAdjustYPct}
                          carScale={carScale} setCarScale={setCarScale}
                          bgScale={bgScale} setBgScale={setBgScale}
                          setCompositionZoom={setCompositionZoom}
                          setCarAdjustXPct={setCarAdjustXPct}
                          backgroundControlsLocked={backgroundControlsLocked}
                          onInViewChange={handleAdjustCompositionInView}
                        />
                        {productType !== 'mug' && (
                          <ArtworkPositionSelector
                            artworkSide={artworkSide}
                            setArtworkSide={setArtworkSide}
                            disabled={backgroundControlsLocked}
                          />
                        )}
                        <TextOverlayToggle
                          enabled={addTextEnabled}
                          onChange={handleAddTextToggle}
                          disabled={backgroundControlsLocked}
                        />
                        {addTextEnabled && productType !== 'mug' && (
                          <TextPlacementSelector
                            placement={textPlacement}
                            onChange={setTextPlacement}
                            disabled={backgroundControlsLocked}
                          />
                        )}
                        {addTextEnabled && (
                          <TextLayerEditor
                            textLayers={textLayerHook.textLayers}
                            selectedTextLayerId={textLayerHook.selectedTextLayerId}
                            setSelectedTextLayerId={textLayerHook.setSelectedTextLayerId}
                            selectedTextLayer={textLayerHook.selectedTextLayer}
                            availableFontOptions={availableFontOptions}
                            backgroundControlsLocked={backgroundControlsLocked}
                            onAddTextLayer={textLayerHook.addTextLayer}
                            onUpdateTextLayer={textLayerHook.updateTextLayer}
                            onRemoveTextLayer={textLayerHook.removeTextLayer}
                            onMoveTextLayer={textLayerHook.moveTextLayer}
                            onNudgeTextFontSize={textLayerHook.nudgeTextFontSize}
                            getPrintZoneCornerPosition={getPrintZoneCornerPosition}
                            printZoneCornerImage={printZoneCornerImage}
                            onUpdatePrintZoneCornerImage={updatePrintZoneCornerImage}
                            onUploadCornerImage={() => cornerImageFileRef.current?.click()}
                            onRemoveCornerImage={removePrintZoneCornerImage}
                            garmentColorTitle={selectedColorTitle}
                            onApplyCornerPreset={applyCornerPreset}
                          />
                        )}
                        <DownloadArtworkSection
                          enabled={downloadArtworkEnabled}
                          onChange={setDownloadArtworkEnabled}
                          disabled={backgroundControlsLocked}
                        />
                        <TestArtworkDownload
                          artworkUrl={artworkUrl}
                          compositeDataUrl={compositeDataUrl}
                          artworkOnlyDataUrl={artworkOnlyDataUrl}
                          textOnlyDataUrl={textOnlyDataUrl}
                          cornersOnlyDataUrl={cornersOnlyDataUrl}
                          mockupPlacement={mockupPlacement}
                          productType={productType}
                          artworkSide={artworkSide}
                          textPlacement={textPlacement}
                          disabled={backgroundControlsLocked}
                        />
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
          className={`${styles.mobileResultDock} ${mobileDockVisible ? styles.mobileResultDockVisible : ''}`}
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
          aria-hidden={!mobileDockVisible}
          tabIndex={mobileDockVisible ? 0 : -1}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mobileResultDockSrc} alt="" />
        </button>
      )}

      {!!mobileResultDockSrc && composite.showMobileResultDock && mobileDockDismissed && !forceDockForComposition && (
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

      <input ref={cornerImageFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCornerImageFile} disabled={backgroundControlsLocked} />

      {isErasingArtwork && viewingUrl && (
        <WhiteGapEraser
          imageUrl={viewingUrl}
          onCancel={() => setIsErasingArtwork(false)}
          onSave={(newUrl) => {
            carGen.setRevisions((prev) => {
              const next = [
                ...prev,
                { url: newUrl, label: `${prev.length + 1} · Erased`, transparent: true },
              ]
              carGen.setViewIndex(next.length - 1)
              return next
            })
            setIsErasingArtwork(false)
          }}
        />
      )}

      {composite.renderHiddenCanvas()}
    </main>
  )
}
