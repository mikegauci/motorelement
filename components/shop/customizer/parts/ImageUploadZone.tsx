'use client'
/* eslint-disable @next/next/no-img-element */

import styles from '../styles'

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
      <div className="absolute inset-0 bg-void/45" />

      <div
        className="absolute inset-0 opacity-30 animate-gen-grid-pan"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(220,38,38,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(220,38,38,0.18) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div
        className="absolute inset-x-0 h-12 animate-gen-scan-sweep"
        style={{
          background:
            'linear-gradient(to bottom, rgba(220,38,38,0) 0%, rgba(220,38,38,0.18) 70%, rgba(255,90,90,0.55) 92%, rgba(255,120,120,1) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 h-[2px] animate-gen-scan-sweep"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(255,120,120,1) 20%, rgba(255,255,255,0.9) 50%, rgba(255,120,120,1) 80%, transparent)',
          boxShadow: '0 0 12px 2px rgba(220,38,38,0.75)',
        }}
      />

      <span className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-ignition animate-gen-corner-blink" />
      <span
        className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-ignition animate-gen-corner-blink"
        style={{ animationDelay: '0.2s' }}
      />
      <span
        className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-ignition animate-gen-corner-blink"
        style={{ animationDelay: '0.4s' }}
      />
      <span
        className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-ignition animate-gen-corner-blink"
        style={{ animationDelay: '0.6s' }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-20 h-20 animate-gen-reticle-pulse">
          <span className="absolute inset-0 rounded-full border-2 border-ignition/80" />
          <span
            className="absolute inset-1 rounded-full animate-gen-reticle-rotate"
            style={{
              backgroundImage:
                'conic-gradient(rgba(220,38,38,0.55), transparent 35%, rgba(220,38,38,0.55) 50%, transparent 85%)',
              WebkitMask: 'radial-gradient(closest-side, transparent 68%, #000 70%)',
              mask: 'radial-gradient(closest-side, transparent 68%, #000 70%)',
            }}
          />
          <span className="absolute top-1/2 left-1/2 w-10 h-[1px] -translate-x-1/2 -translate-y-1/2 bg-ignition/70" />
          <span className="absolute top-1/2 left-1/2 h-10 w-[1px] -translate-x-1/2 -translate-y-1/2 bg-ignition/70" />
          <span className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ignition shadow-[0_0_8px_2px_rgba(220,38,38,0.8)]" />
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] font-mono text-ignition animate-gen-label-fade whitespace-nowrap">
        ANALYZING IMAGE
      </div>
    </div>
  )
}
