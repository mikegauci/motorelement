'use client'

import { useState } from 'react'
import styles from './styles'
import ImageUploadZone from './parts/ImageUploadZone'
import ImageLightbox from './parts/ImageLightbox'
import type { IllustrationMode } from './CustomizerContext'

interface VehicleInputFormProps {
  customerNotes: string
  setCustomerNotes: (v: string) => void
  carImagePreview: string | null
  vehicleLocked: boolean
  running: boolean
  canRun: boolean
  isDone: boolean
  revCount: number
  illustrationMode: IllustrationMode
  onUploadClick: () => void
  onRemoveCarImage: () => void
  onLoadImageUrl: (url: string) => Promise<void>
  onGenerate: () => void
  onChooseDesigner: () => void
  onUploadIllustration: () => void
  onSwitchToAi: () => void
  onCancel: () => void
  onReset: () => void
}

export default function VehicleInputForm({
  customerNotes,
  setCustomerNotes,
  carImagePreview,
  vehicleLocked,
  running,
  canRun,
  isDone,
  revCount,
  illustrationMode,
  onUploadClick,
  onRemoveCarImage,
  onLoadImageUrl,
  onGenerate,
  onChooseDesigner,
  onUploadIllustration,
  onSwitchToAi,
  onCancel,
  onReset,
}: VehicleInputFormProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const showModeChoice = !vehicleLocked && illustrationMode === null
  const showAiActions = !vehicleLocked && illustrationMode === 'ai'
  const showDesignerLocked = vehicleLocked && illustrationMode === 'designer'
  const urlDisabled = vehicleLocked || running || urlLoading

  async function handleLoadUrl() {
    setUrlError(null)
    setUrlLoading(true)
    try {
      await onLoadImageUrl(imageUrl)
    } catch (err) {
      setUrlError((err as Error).message || 'Failed to load image from URL')
    } finally {
      setUrlLoading(false)
    }
  }

  return (
    <div className={styles.setup}>
      <div className={styles.setupBlock}>
        <ImageUploadZone
          imagePreview={carImagePreview}
          placeholder="Click to upload your photo"
          altText="Car preview"
          locked={vehicleLocked}
          processing={running}
          onUploadClick={onUploadClick}
          onViewImage={setLightboxSrc}
          onReplaceImage={onUploadClick}
          onRemoveImage={onRemoveCarImage}
        />
        {!vehicleLocked && (
          <div className="mt-3 flex flex-col gap-1.5">
            <label className={styles.label}>Or paste image URL</label>
            <div className="flex gap-2 items-stretch">
              <input
                type="url"
                className={styles.input}
                placeholder="https://…"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  if (urlError) setUrlError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (imageUrl.trim() && !urlDisabled) void handleLoadUrl()
                  }
                }}
                disabled={urlDisabled}
              />
              <button
                type="button"
                className={styles.btnSecondaryChoice}
                onClick={handleLoadUrl}
                disabled={urlDisabled || !imageUrl.trim()}
              >
                {urlLoading ? 'Loading…' : 'Load'}
              </button>
            </div>
            {urlError && (
              <p className="text-xs text-ignition m-0" role="alert">
                {urlError}
              </p>
            )}
          </div>
        )}
      </div>

      <ImageLightbox src={lightboxSrc} alt="Full car preview" onClose={() => setLightboxSrc(null)} />

      <div className={styles.vehicleFields}>
        <div className={styles.setupBlock}>
          <label className={styles.label}>Customisation Notes</label>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="Add any details you wish to include or exclude"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            disabled={vehicleLocked && illustrationMode !== 'designer'}
          />
        </div>
        {showModeChoice && (
          <div className={styles.vehicleActionsStack}>
            <div className={styles.vehicleActionWithHint}>
              <button className={styles.btnPrimary} onClick={onGenerate} disabled={!canRun}>
                {running ? 'Creating...' : 'Create My Illustration Now'}
              </button>
              <p className={styles.vehicleActionHint}>Instant</p>
            </div>
            <div className={styles.vehicleActionWithHint}>
              <button
                type="button"
                className={styles.btnSecondaryChoice}
                onClick={onChooseDesigner}
                disabled={!canRun || running}
              >
                Create Illustration by a Designer
              </button>
              <p className={styles.vehicleActionHint}>2–3 days</p>
            </div>
            <div className={styles.vehicleActionWithHint}>
              <button
                type="button"
                className={styles.btnSecondaryChoice}
                onClick={onUploadIllustration}
                disabled={running}
              >
                Upload Existing Illustration
              </button>
              <p className={styles.vehicleActionHint}>Test</p>
            </div>
          </div>
        )}
        {showAiActions && (
          <div className={styles.vehicleActions}>
            <button className={styles.btnPrimary} onClick={onGenerate} disabled={!canRun}>
              {running ? 'Creating...' : 'Create My Illustration Now'}
            </button>
            <button
              type="button"
              className={styles.btnSecondaryChoice}
              onClick={onUploadIllustration}
              disabled={running}
            >
              Upload Existing
            </button>
            {running && (
              <button type="button" className={styles.btn} onClick={onCancel}>
                Cancel request
              </button>
            )}
            {isDone && revCount > 0 && (
              <button type="button" className={styles.btn} onClick={onReset}>
                Start over
              </button>
            )}
          </div>
        )}
        {showDesignerLocked && (
          <div className={styles.vehicleActionsStack}>
            <p className={styles.hint}>
              A designer will illustrate your ride in 1 – 3 days. Continue with the customisation below, then finalise and add to cart.
            </p>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onSwitchToAi}
              disabled={running}
            >
              Or Get Instant Results
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
