'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import styles from '../styles'

const GENERATION_MESSAGES = [
  'ANALYZING IMAGE',
  'IDENTIFYING YOUR MODEL',
  'PICKING UP FINE DETAILS',
  'REFINING THE ARTWORK',
  'REMOVING THE BACKGROUND',
  'ALMOST READY...',
]
const MESSAGE_INTERVAL_MS = 16000

interface ImageUploadZoneProps {
  imagePreview: string | null
  placeholder: string
  altText: string
  locked?: boolean
  processing?: boolean
  onUploadClick: () => void
  onViewImage?: (src: string) => void
  onReplaceImage: () => void
  onRemoveImage: () => void
}

export default function ImageUploadZone({
  imagePreview,
  placeholder,
  altText,
  locked,
  processing,
  onUploadClick,
  onViewImage,
  onReplaceImage,
  onRemoveImage,
}: ImageUploadZoneProps) {
  return (
    <div
      className={`${styles.uploadZone} ${imagePreview ? styles.hasImage : ''} relative`}
      onClick={() => { if (!imagePreview && !locked) onUploadClick() }}
    >
      {imagePreview ? (
        <>
          <img src={imagePreview} alt={altText} className={styles.preview} />
          {!processing && (
            <div className="absolute top-2 right-2 flex gap-1.5 z-20">
              <button
                type="button"
                title="View full image"
                className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm transition-colors"
                onClick={(e) => { e.stopPropagation(); onViewImage?.(imagePreview) }}
              >⤢</button>
              {!locked && (
                <>
                  <button
                    type="button"
                    title="Replace image"
                    className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm transition-colors"
                    onClick={(e) => { e.stopPropagation(); onReplaceImage() }}
                  >↻</button>
                  <button
                    type="button"
                    title="Remove image"
                    className="w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center text-sm transition-colors"
                    onClick={(e) => { e.stopPropagation(); onRemoveImage() }}
                  >✕</button>
                </>
              )}
            </div>
          )}
          {processing && <GenerationOverlay />}
        </>
      ) : (
        <div className={styles.uploadPlaceholder}>
          <span className={styles.uploadIcon}>↑</span>
          <span>{placeholder}</span>
        </div>
      )}
    </div>
  )
}

function GenerationOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      <div className="absolute inset-0 bg-void/55" />

      <div
        className="absolute inset-0 animate-gen-aurora-pulse"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(220,38,38,0.35) 0%, rgba(220,38,38,0.12) 35%, transparent 70%)',
        }}
      />

      <div
        className="absolute top-0 bottom-0 w-1/3 animate-gen-shimmer-diagonal"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,200,200,0.22) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)',
          filter: 'blur(10px)',
        }}
      />

      <GenerationTimer />
      <GenerationLabel />
    </div>
  )
}

function GenerationTimer() {
  const [secondsLeft, setSecondsLeft] = useState(90)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  return (
    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 font-mono font-bold text-[11px] tracking-[0.2em] text-white/90">
      {secondsLeft}s
    </div>
  )
}

function GenerationLabel() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (idx >= GENERATION_MESSAGES.length - 1) return
    const t = setTimeout(() => setIdx((v) => v + 1), MESSAGE_INTERVAL_MS)
    return () => clearTimeout(t)
  }, [idx])

  return (
    <div
      key={idx}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono font-bold text-[12px] tracking-[0.28em] text-white/90 animate-gen-label-fade whitespace-nowrap"
    >
      {GENERATION_MESSAGES[idx]}
    </div>
  )
}
