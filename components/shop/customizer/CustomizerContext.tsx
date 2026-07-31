'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { MockupPlacement } from './types'

export type ArtworkSide = 'front' | 'back'
export type TextPlacement = 'same' | 'opposite'
export type IllustrationMode = 'ai' | 'designer' | null

interface CustomizerContextValue {
  artworkUrl: string | null
  setArtworkUrl: (url: string | null) => void
  compositeDataUrl: string | null
  setCompositeDataUrl: (url: string | null) => void
  artworkOnlyDataUrl: string | null
  setArtworkOnlyDataUrl: (url: string | null) => void
  textOnlyDataUrl: string | null
  setTextOnlyDataUrl: (url: string | null) => void
  cornersOnlyDataUrl: string | null
  setCornersOnlyDataUrl: (url: string | null) => void
  mockupPlacement: MockupPlacement
  setMockupPlacement: (p: MockupPlacement) => void
  generationStatus: 'idle' | 'running' | 'done' | 'error'
  setGenerationStatus: (s: 'idle' | 'running' | 'done' | 'error') => void
  tshirtBaseImage: string | null
  setTshirtBaseImage: (url: string | null) => void
  productType: string
  setProductType: (t: string) => void
  selectedColorHex: string | null
  setSelectedColorHex: (hex: string | null) => void
  selectedColorTitle: string | null
  setSelectedColorTitle: (title: string | null) => void
  mockupThumbnailUrl: string | null
  setMockupThumbnailUrl: (url: string | null) => void
  artworkSide: ArtworkSide
  setArtworkSide: (s: ArtworkSide) => void
  textPlacement: TextPlacement
  setTextPlacement: (p: TextPlacement) => void
  mockupViewSide: ArtworkSide
  setMockupViewSide: (s: ArtworkSide) => void
  mockupBaseNaturalWidth: number | null
  mockupBaseNaturalHeight: number | null
  setMockupBaseNaturalSize: (size: { width: number; height: number } | null) => void
  downloadArtworkEnabled: boolean
  setDownloadArtworkEnabled: (enabled: boolean) => void
  artworkHasExtras: boolean
  setArtworkHasExtras: (hasExtras: boolean) => void
  illustrationMode: IllustrationMode
  setIllustrationMode: (mode: IllustrationMode) => void
  customerPhotoDataUrl: string | null
  setCustomerPhotoDataUrl: (url: string | null) => void
  customerNotes: string
  setCustomerNotes: (notes: string) => void
  designerBackgroundUrl: string | null
  setDesignerBackgroundUrl: (url: string | null) => void
  designerRequestedText: string
  setDesignerRequestedText: (text: string) => void
  designerTextCorner: string | null
  setDesignerTextCorner: (v: string | null) => void
  designerCornerImageUrl: string | null
  setDesignerCornerImageUrl: (url: string | null) => void
  designerCornerImageLabel: string | null
  setDesignerCornerImageLabel: (label: string | null) => void
  aiArtworkUrl: string | null
  setAiArtworkUrl: (url: string | null) => void
  designerIncludeSourceFiles: boolean
  setDesignerIncludeSourceFiles: (enabled: boolean) => void
  designerPriority: boolean
  setDesignerPriority: (enabled: boolean) => void
}

const CustomizerContext = createContext<CustomizerContextValue | null>(null)

export function CustomizerProvider({ children }: { children: ReactNode }) {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [compositeDataUrl, setCompositeDataUrl] = useState<string | null>(null)
  const [artworkOnlyDataUrl, setArtworkOnlyDataUrl] = useState<string | null>(null)
  const [textOnlyDataUrl, setTextOnlyDataUrl] = useState<string | null>(null)
  const [cornersOnlyDataUrl, setCornersOnlyDataUrl] = useState<string | null>(null)
  const [productType, setProductType] = useState('t-shirt')
  const [mockupPlacement, setMockupPlacementRaw] = useState<MockupPlacement>({
    xPct: 0.5,
    yPct: 0.5,
    scale: 1,
  })
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [tshirtBaseImage, setTshirtBaseImage] = useState<string | null>(null)
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null)
  const [selectedColorTitle, setSelectedColorTitle] = useState<string | null>(null)
  const [mockupThumbnailUrl, setMockupThumbnailUrl] = useState<string | null>(null)
  const [artworkSide, setArtworkSide] = useState<ArtworkSide>('front')
  const [textPlacement, setTextPlacement] = useState<TextPlacement>('same')
  const [mockupViewSide, setMockupViewSide] = useState<ArtworkSide>('front')
  const [mockupBaseNaturalWidth, setMockupBaseNaturalWidth] = useState<number | null>(null)
  const [mockupBaseNaturalHeight, setMockupBaseNaturalHeight] = useState<number | null>(null)
  const [downloadArtworkEnabled, setDownloadArtworkEnabled] = useState(false)
  const [artworkHasExtras, setArtworkHasExtras] = useState(false)
  const [illustrationMode, setIllustrationMode] = useState<IllustrationMode>(null)
  const [customerPhotoDataUrl, setCustomerPhotoDataUrl] = useState<string | null>(null)
  const [customerNotes, setCustomerNotes] = useState('')
  const [designerBackgroundUrl, setDesignerBackgroundUrl] = useState<string | null>(null)
  const [designerRequestedText, setDesignerRequestedText] = useState('')
  const [designerTextCorner, setDesignerTextCorner] = useState<string | null>(null)
  const [designerCornerImageUrl, setDesignerCornerImageUrl] = useState<string | null>(null)
  const [designerCornerImageLabel, setDesignerCornerImageLabel] = useState<string | null>(null)
  const [aiArtworkUrl, setAiArtworkUrl] = useState<string | null>(null)
  const [designerIncludeSourceFiles, setDesignerIncludeSourceFiles] = useState(false)
  const [designerPriority, setDesignerPriority] = useState(false)

  useEffect(() => {
    setMockupPlacementRaw((prev) =>
      prev.scale === 1 && prev.yPct === 0.5 ? prev : { ...prev, scale: 1, yPct: 0.5 }
    )
  }, [productType])

  // Whenever the artwork side OR the text placement changes, snap the mockup
  // view to the side that just became "interesting":
  //   - same:     view the artwork side (everything lives there)
  //   - opposite: view the OPPOSITE side so the user immediately sees the
  //               text move over.
  // The user can still flip back and forth via the mockup's Front/Back toggle.
  useEffect(() => {
    setMockupViewSide(
      textPlacement === 'opposite'
        ? (artworkSide === 'front' ? 'back' : 'front')
        : artworkSide
    )
  }, [artworkSide, textPlacement])

  const setMockupPlacement = useCallback((p: MockupPlacement) => {
    setMockupPlacementRaw({
      xPct: Math.min(1, Math.max(0, p.xPct)),
      yPct: Math.min(1, Math.max(0, p.yPct)),
      scale: Math.min(2, Math.max(0.1, p.scale)),
    })
  }, [])

  const setMockupBaseNaturalSize = useCallback((size: { width: number; height: number } | null) => {
    setMockupBaseNaturalWidth(size?.width ?? null)
    setMockupBaseNaturalHeight(size?.height ?? null)
  }, [])

  return (
    <CustomizerContext.Provider
      value={{
        artworkUrl,
        setArtworkUrl,
        compositeDataUrl,
        setCompositeDataUrl,
        artworkOnlyDataUrl,
        setArtworkOnlyDataUrl,
        textOnlyDataUrl,
        setTextOnlyDataUrl,
        cornersOnlyDataUrl,
        setCornersOnlyDataUrl,
        mockupPlacement,
        setMockupPlacement,
        generationStatus,
        setGenerationStatus,
        tshirtBaseImage,
        setTshirtBaseImage,
        productType,
        setProductType,
        selectedColorHex,
        setSelectedColorHex,
        selectedColorTitle,
        setSelectedColorTitle,
        mockupThumbnailUrl,
        setMockupThumbnailUrl,
        artworkSide,
        setArtworkSide,
        textPlacement,
        setTextPlacement,
        mockupViewSide,
        setMockupViewSide,
        mockupBaseNaturalWidth,
        mockupBaseNaturalHeight,
        setMockupBaseNaturalSize,
        downloadArtworkEnabled,
        setDownloadArtworkEnabled,
        artworkHasExtras,
        setArtworkHasExtras,
        illustrationMode,
        setIllustrationMode,
        customerPhotoDataUrl,
        setCustomerPhotoDataUrl,
        customerNotes,
        setCustomerNotes,
        designerBackgroundUrl,
        setDesignerBackgroundUrl,
        designerRequestedText,
        setDesignerRequestedText,
        designerTextCorner,
        setDesignerTextCorner,
        designerCornerImageUrl,
        setDesignerCornerImageUrl,
        designerCornerImageLabel,
        setDesignerCornerImageLabel,
        aiArtworkUrl,
        setAiArtworkUrl,
        designerIncludeSourceFiles,
        setDesignerIncludeSourceFiles,
        designerPriority,
        setDesignerPriority,
      }}
    >
      {children}
    </CustomizerContext.Provider>
  )
}

export function useCustomizer() {
  const ctx = useContext(CustomizerContext)
  if (!ctx) throw new Error('useCustomizer must be used within CustomizerProvider')
  return ctx
}
