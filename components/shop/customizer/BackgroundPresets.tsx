'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import type { SavedCustomBackground } from './types'
import { BACKGROUND_PRESETS, CUSTOM_BACKGROUND_NEW } from './constants'
import styles from './styles'

interface BackgroundPresetsProps {
  selectedPresetId: string | null
  setSelectedPresetId: (id: string | null) => void
  savedCustomBackgrounds: SavedCustomBackground[]
  backgroundControlsLocked: boolean
  customBackgroundGenerating: boolean
  customBackgroundElapsed: number
  onCancelBackgroundGeneration: () => void
  // Custom background panel
  showCustomPanel: boolean
  customBackgroundImagePreview: string | null
  customBackgroundValue: string
  setCustomBackgroundValue: (v: string) => void
  canGenerateCustomBackground: boolean
  onCustomBackgroundUploadClick: () => void
  onRunCustomBackgroundGeneration: () => void
  customBackgroundError: string
  // Tweak panel
  isCustomSavedSelection: boolean
  selectedCustomBg: SavedCustomBackground | null
  isBackgroundTweakOpen: boolean
  setIsBackgroundTweakOpen: (v: boolean) => void
  backgroundTweakNotes: string
  setBackgroundTweakNotes: (v: string) => void
  customBackgroundRemoving: boolean
  onRunBackgroundTweak: () => void
  // Reset custom panel state callback
  onResetCustomPanel: () => void
  onRemoveCustomImage: () => void
}

export default function BackgroundPresets({
  selectedPresetId,
  setSelectedPresetId,
  savedCustomBackgrounds,
  backgroundControlsLocked,
  customBackgroundGenerating,
  customBackgroundElapsed,
  onCancelBackgroundGeneration,
  showCustomPanel,
  customBackgroundImagePreview,
  customBackgroundValue,
  setCustomBackgroundValue,
  canGenerateCustomBackground,
  onCustomBackgroundUploadClick,
  onRunCustomBackgroundGeneration,
  customBackgroundError,
  isCustomSavedSelection,
  selectedCustomBg,
  isBackgroundTweakOpen,
  setIsBackgroundTweakOpen,
  backgroundTweakNotes,
  setBackgroundTweakNotes,
  customBackgroundRemoving,
  onRunBackgroundTweak,
  onResetCustomPanel,
  onRemoveCustomImage,
}: BackgroundPresetsProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [showAllPresets, setShowAllPresets] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const presetLimit = isMobile ? 9 : 7
  const visiblePresets = showAllPresets ? BACKGROUND_PRESETS : BACKGROUND_PRESETS.slice(0, presetLimit)
  const hasMore = BACKGROUND_PRESETS.length > presetLimit

  return (
    <section
      className={`${styles.presetSection} ${styles.presetSectionInline}`}
      aria-label="Background presets"
    >
      <h2 className={styles.presetSectionTitle}>Background preset</h2>
      <p className={styles.presetSectionIntro}>
        Choose a background preset or stay transparent — then add text and download a print-ready PNG.
      </p>
      {customBackgroundGenerating && (
        <div className={styles.backgroundProgress}>
          <div className={styles.spinner} />
          <span>Generating background… {customBackgroundElapsed}s</span>
          <button
            type="button"
            className={styles.btnBackgroundCancel}
            onClick={onCancelBackgroundGeneration}
          >
            Cancel request
          </button>
        </div>
      )}
      <div className={styles.presetPicker}>
        <button
          type="button"
          className={`${styles.presetOption} ${selectedPresetId === null ? styles.presetOptionActive : ''}`}
          onClick={() => setSelectedPresetId(null)}
          disabled={backgroundControlsLocked}
        >
          <span className={styles.presetNoneLabel}>None</span>
          <span className={styles.presetOptionCaption}>Transparent only</span>
          <span className={styles.presetOptionSub}>Text overlays below</span>
        </button>
        {visiblePresets.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={`${styles.presetOption} ${selectedPresetId === p.id ? styles.presetOptionActive : ''}`}
            onClick={() => setSelectedPresetId(p.id)}
            disabled={backgroundControlsLocked}
          >
            <span className={styles.presetThumbWrap}>
              <img src={p.src} alt="" className={styles.presetThumb} loading={i < 4 ? 'eager' : 'lazy'} />
            </span>
            <span className={styles.presetOptionCaption}>{p.name}</span>
          </button>
        ))}
        {hasMore && !showAllPresets && (
          <button
            type="button"
            className={`${styles.presetOption} ${styles.presetOptionNew}`}
            onClick={() => setShowAllPresets(true)}
          >
            <span className={styles.presetNoneLabel}>+{BACKGROUND_PRESETS.length - presetLimit}</span>
            <span className={styles.presetOptionCaption}>Show all</span>
          </button>
        )}
        {savedCustomBackgrounds.map((bg) => (
          <button
            key={bg.id}
            type="button"
            className={`${styles.presetOption} ${selectedPresetId === bg.id ? styles.presetOptionActive : ''}`}
            onClick={() => setSelectedPresetId(bg.id)}
            disabled={backgroundControlsLocked}
          >
            <span className={styles.presetThumbWrap}>
              <img src={bg.thumbUrl || bg.resultUrl} alt="" className={styles.presetThumb} loading="lazy" />
            </span>
            <span className={styles.presetOptionCaption}>{bg.label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`${styles.presetOption} ${styles.presetOptionNew} ${selectedPresetId === CUSTOM_BACKGROUND_NEW ? styles.presetOptionActive : ''}`}
          onClick={onResetCustomPanel}
          disabled={backgroundControlsLocked}
        >
          <span className={styles.presetNewLabel}>+</span>
          <span className={styles.presetOptionCaption}>Custom background</span>
        </button>
      </div>

      {showCustomPanel && (
        <div className={styles.customBackgroundPanel}>
          <div className={styles.setupBlock}>
            <label className={styles.label}>Attach image for background reference (optional)</label>
            <div
              className={`${styles.uploadZone} ${customBackgroundImagePreview ? styles.hasImage : ''} relative`}
              onClick={() => { if (!backgroundControlsLocked && !customBackgroundImagePreview) onCustomBackgroundUploadClick() }}
            >
              {customBackgroundImagePreview ? (
                <>
                  <img src={customBackgroundImagePreview} alt="Custom background preview" className={styles.preview} />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      title="View full image"
                      className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm transition-colors"
                      onClick={(e) => { e.stopPropagation(); setLightboxSrc(customBackgroundImagePreview) }}
                    >⤢</button>
                    <button
                      type="button"
                      title="Replace image"
                      className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm transition-colors"
                      onClick={(e) => { e.stopPropagation(); if (!backgroundControlsLocked) onCustomBackgroundUploadClick() }}
                    >↻</button>
                    <button
                      type="button"
                      title="Remove image"
                      className="w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center text-sm transition-colors"
                      onClick={(e) => { e.stopPropagation(); if (!backgroundControlsLocked) onRemoveCustomImage() }}
                    >✕</button>
                  </div>
                </>
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <span className={styles.uploadIcon}>↑</span>
                  <span>Click to upload JPG or PNG</span>
                </div>
              )}
            </div>
          </div>
          <div className={styles.setupBlock}>
            <label className={styles.label}>Describe location and theme</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Tokyo city lights at sunset"
              value={customBackgroundValue}
              onChange={(e) => setCustomBackgroundValue(e.target.value)}
              disabled={backgroundControlsLocked}
            />
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onRunCustomBackgroundGeneration}
              disabled={!canGenerateCustomBackground}
            >
              {customBackgroundGenerating ? 'Generating background…' : 'Generate custom background'}
            </button>
          </div>
          {customBackgroundError && (
            <p className={styles.customBackgroundError}>{customBackgroundError}</p>
          )}
        </div>
      )}

      {isCustomSavedSelection && selectedCustomBg && (
        <div className={styles.customBackgroundPanel}>
          <button
            type="button"
            className={styles.collapseToggle}
            aria-expanded={isBackgroundTweakOpen}
            onClick={() => setIsBackgroundTweakOpen(!isBackgroundTweakOpen)}
            disabled={backgroundControlsLocked}
          >
            {isBackgroundTweakOpen ? '▼' : '►'} Tweak background (optional)
          </button>
          {isBackgroundTweakOpen && (
            <>
              <div className={styles.setupBlock}>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Describe any changes you want to make to the background."
                  value={backgroundTweakNotes}
                  onChange={(e) => setBackgroundTweakNotes(e.target.value)}
                  disabled={backgroundControlsLocked}
                />
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={onRunBackgroundTweak}
                  disabled={!backgroundTweakNotes.trim() || customBackgroundGenerating || customBackgroundRemoving}
                >
                  {customBackgroundGenerating ? 'Generating…' : 'Tweak background'}
                </button>
              </div>
              {customBackgroundError && (
                <p className={styles.customBackgroundError}>{customBackgroundError}</p>
              )}
            </>
          )}
        </div>
      )}

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition-colors"
            onClick={() => setLightboxSrc(null)}
          >✕</button>
          <img
            src={lightboxSrc}
            alt="Full background preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
