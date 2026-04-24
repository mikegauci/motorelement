'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { SavedCustomBackground } from './types'
import { BACKGROUND_PRESETS, CUSTOM_BACKGROUND_NEW } from './constants'
import styles from './styles'
import ImageUploadZone from './parts/ImageUploadZone'
import ImageLightbox from './parts/ImageLightbox'
import CollapsibleTweak from './parts/CollapsibleTweak'

interface BackgroundPresetsProps {
  selectedPresetId: string | null
  setSelectedPresetId: (id: string | null) => void
  savedCustomBackgrounds: SavedCustomBackground[]
  transparentCarUrl: string | null
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
  transparentCarUrl,
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
        Choose a background preset or stay transparent.
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
          {transparentCarUrl ? (
            <span className={styles.presetThumbWrap}>
              <img src={transparentCarUrl} alt="Transparent only" className={`${styles.presetThumb} !object-contain`} />
            </span>
          ) : (
            <span className={styles.presetNoneLabel}>None</span>
          )}
          <span className={styles.presetOptionCaption}>No background</span>
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
              <Image src={p.src} alt={p.name} width={210} height={210} className={styles.presetThumb} loading={i < 4 ? 'eager' : 'lazy'} />
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
            <ImageUploadZone
              imagePreview={customBackgroundImagePreview}
              placeholder="Click to upload JPG or PNG"
              altText="Custom background preview"
              locked={backgroundControlsLocked}
              onUploadClick={onCustomBackgroundUploadClick}
              onViewImage={setLightboxSrc}
              onReplaceImage={onCustomBackgroundUploadClick}
              onRemoveImage={onRemoveCustomImage}
            />
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
          <CollapsibleTweak
            label="Refine the background"
            isOpen={isBackgroundTweakOpen}
            onToggle={() => setIsBackgroundTweakOpen(!isBackgroundTweakOpen)}
            disabled={backgroundControlsLocked}
          >
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
          </CollapsibleTweak>
        </div>
      )}

      <ImageLightbox src={lightboxSrc} alt="Full background preview" onClose={() => setLightboxSrc(null)} />
    </section>
  )
}
