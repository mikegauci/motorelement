'use client'

import { useState } from 'react'
import styles from './styles'
import { buildPrintAreaPng } from './helpers'
import type { MockupPlacement } from './types'
import type { PrintExportMultiplierOverrides } from './constants'
import { triggerBlobDownload } from '@/lib/shop/downloadArtwork'

interface TestArtworkDownloadProps {
  artworkUrl: string | null
  compositeDataUrl: string | null
  artworkOnlyDataUrl: string | null
  textOnlyDataUrl: string | null
  cornersOnlyDataUrl: string | null
  mockupPlacement: MockupPlacement
  productType: string
  artworkSide: 'front' | 'back'
  textPlacement: 'same' | 'opposite'
  printMultiplierOverrides?: PrintExportMultiplierOverrides | null
  disabled?: boolean
}

export default function TestArtworkDownload({
  artworkUrl,
  compositeDataUrl,
  artworkOnlyDataUrl,
  textOnlyDataUrl,
  cornersOnlyDataUrl,
  mockupPlacement,
  productType,
  artworkSide,
  textPlacement,
  printMultiplierOverrides = null,
  disabled = false,
}: TestArtworkDownloadProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOpposite = textPlacement === 'opposite' && !!textOnlyDataUrl
  const printSource = isOpposite
    ? (artworkOnlyDataUrl ?? compositeDataUrl ?? artworkUrl)
    : (compositeDataUrl ?? artworkUrl)

  const canDownload = !!printSource && !disabled && !busy

  async function handleDownload() {
    if (!printSource) return
    setBusy(true)
    setError(null)
    try {
      const oppositeSide: 'front' | 'back' = artworkSide === 'front' ? 'back' : 'front'
      const cornersForArtworkSide = textPlacement === 'same' ? cornersOnlyDataUrl : null
      const cornersForOppositeSide = textPlacement === 'opposite' ? cornersOnlyDataUrl : null

      const printBlob = await buildPrintAreaPng(
        printSource,
        mockupPlacement,
        productType,
        artworkSide,
        printMultiplierOverrides,
        cornersForArtworkSide,
      )
      triggerBlobDownload(printBlob, `print-area-${artworkSide}.png`)

      if (isOpposite && textOnlyDataUrl) {
        const textBlob = await buildPrintAreaPng(
          textOnlyDataUrl,
          { xPct: 0.5, yPct: 0.5, scale: 1 },
          productType,
          oppositeSide,
          printMultiplierOverrides,
          cornersForOppositeSide,
        )
        triggerBlobDownload(textBlob, `print-area-${oppositeSide}-text.png`)
      }
    } catch (err) {
      console.error('Test artwork download failed:', err)
      setError('Download failed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.presetSection} aria-label="Test download artwork">
      <h2 className={styles.presetSectionTitle}>Test: Download Artwork</h2>
      <p className={styles.presetSectionIntro}>
        Download print-ready PNG(s) immediately for testing. Same export as cart / Printify.
      </p>
      <button
        type="button"
        onClick={handleDownload}
        disabled={!canDownload}
        className={styles.btnPrimary}
      >
        {busy ? 'Preparing…' : isOpposite ? 'Download Print Files' : 'Download Print File'}
      </button>
      {error && (
        <p className="mt-2 text-xs text-ignition m-0" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
