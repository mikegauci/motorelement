'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { MockupPlacement } from './types'
import { getProductProfile } from './constants'

export type ArtworkSide = 'front' | 'back'
export type TextPlacement = 'same' | 'opposite'

interface CustomizerContextValue {
  artworkUrl: string | null
  setArtworkUrl: (url: string | null) => void
  compositeDataUrl: string | null
  setCompositeDataUrl: (url: string | null) => void
  artworkOnlyDataUrl: string | null
  setArtworkOnlyDataUrl: (url: string | null) => void
  textOnlyDataUrl: string | null
  setTextOnlyDataUrl: (url: string | null) => void
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
  mockupThumbnailUrl: string | null
  setMockupThumbnailUrl: (url: string | null) => void
  artworkSide: ArtworkSide
  setArtworkSide: (s: ArtworkSide) => void
  textPlacement: TextPlacement
  setTextPlacement: (p: TextPlacement) => void
  mockupViewSide: ArtworkSide
  setMockupViewSide: (s: ArtworkSide) => void
}

const CustomizerContext = createContext<CustomizerContextValue | null>(null)

export function CustomizerProvider({ children }: { children: ReactNode }) {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [compositeDataUrl, setCompositeDataUrl] = useState<string | null>(null)
  const [artworkOnlyDataUrl, setArtworkOnlyDataUrl] = useState<string | null>(null)
  const [textOnlyDataUrl, setTextOnlyDataUrl] = useState<string | null>(null)
  const [productType, setProductType] = useState('t-shirt')
  const [mockupPlacement, setMockupPlacementRaw] = useState<MockupPlacement>({
    xPct: 0.5,
    yPct: getProductProfile('t-shirt').defaultArtworkYPct,
    scale: getProductProfile('t-shirt').defaultArtworkScale,
  })
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [tshirtBaseImage, setTshirtBaseImage] = useState<string | null>(null)
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null)
  const [mockupThumbnailUrl, setMockupThumbnailUrl] = useState<string | null>(null)
  const [artworkSide, setArtworkSide] = useState<ArtworkSide>('front')
  const [textPlacement, setTextPlacement] = useState<TextPlacement>('same')
  const [mockupViewSide, setMockupViewSide] = useState<ArtworkSide>('front')

  // Whenever the product type changes, snap the artwork scale and vertical
  // anchor to that product's defaults. Each product has its own print area
  // aspect, so the same composite would otherwise spill out or sit
  // top-anchored (e.g. on hoodies).
  useEffect(() => {
    const profile = getProductProfile(productType)
    const defaultScale = profile.defaultArtworkScale
    const defaultYPct = profile.defaultArtworkYPct
    setMockupPlacementRaw((prev) =>
      prev.scale === defaultScale && prev.yPct === defaultYPct
        ? prev
        : { ...prev, scale: defaultScale, yPct: defaultYPct }
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
      scale: Math.min(1, Math.max(0.1, p.scale)),
    })
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
        mockupThumbnailUrl,
        setMockupThumbnailUrl,
        artworkSide,
        setArtworkSide,
        textPlacement,
        setTextPlacement,
        mockupViewSide,
        setMockupViewSide,
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
