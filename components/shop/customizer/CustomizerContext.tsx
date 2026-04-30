'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { MockupPlacement } from './types'

interface CustomizerContextValue {
  artworkUrl: string | null
  setArtworkUrl: (url: string | null) => void
  compositeDataUrl: string | null
  setCompositeDataUrl: (url: string | null) => void
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
}

const CustomizerContext = createContext<CustomizerContextValue | null>(null)

export function CustomizerProvider({ children }: { children: ReactNode }) {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [compositeDataUrl, setCompositeDataUrl] = useState<string | null>(null)
  const [mockupPlacement, setMockupPlacementRaw] = useState<MockupPlacement>({
    xPct: 0.5,
    yPct: 0.5,
    scale: 1.0,
  })
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [tshirtBaseImage, setTshirtBaseImage] = useState<string | null>(null)
  const [productType, setProductType] = useState('t-shirt')
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null)
  const [mockupThumbnailUrl, setMockupThumbnailUrl] = useState<string | null>(null)

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
