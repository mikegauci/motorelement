'use client'
/* eslint-disable @next/next/no-img-element */

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
}: BackgroundPresetsProps) {
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
        {BACKGROUND_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`${styles.presetOption} ${selectedPresetId === p.id ? styles.presetOptionActive : ''}`}
            onClick={() => setSelectedPresetId(p.id)}
            disabled={backgroundControlsLocked}
          >
            <span className={styles.presetThumbWrap}>
              <img src={p.src} alt="" className={styles.presetThumb} />
            </span>
            <span className={styles.presetOptionCaption}>{p.name}</span>
          </button>
        ))}
        {savedCustomBackgrounds.map((bg) => (
          <button
            key={bg.id}
            type="button"
            className={`${styles.presetOption} ${selectedPresetId === bg.id ? styles.presetOptionActive : ''}`}
            onClick={() => setSelectedPresetId(bg.id)}
            disabled={backgroundControlsLocked}
          >
            <span className={styles.presetThumbWrap}>
              <img src={bg.thumbUrl || bg.resultUrl} alt="" className={styles.presetThumb} />
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
              className={`${styles.uploadZone} ${customBackgroundImagePreview ? styles.hasImage : ''}`}
              onClick={() => { if (!backgroundControlsLocked) onCustomBackgroundUploadClick() }}
            >
              {customBackgroundImagePreview ? (
                <img src={customBackgroundImagePreview} alt="Custom background preview" className={styles.preview} />
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
    </section>
  )
}
