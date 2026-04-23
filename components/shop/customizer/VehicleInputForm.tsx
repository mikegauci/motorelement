'use client'

import { useState } from 'react'
import styles from './styles'
import ImageUploadZone from './parts/ImageUploadZone'
import ImageLightbox from './parts/ImageLightbox'

interface VehicleInputFormProps {
  customerNotes: string
  setCustomerNotes: (v: string) => void
  carImagePreview: string | null
  vehicleLocked: boolean
  running: boolean
  canRun: boolean
  isDone: boolean
  revCount: number
  onUploadClick: () => void
  onRemoveCarImage: () => void
  onGenerate: () => void
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
  onUploadClick,
  onRemoveCarImage,
  onGenerate,
  onCancel,
  onReset,
}: VehicleInputFormProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  return (
    <div className={styles.setup}>
      <div className={styles.setupBlock}>
        <ImageUploadZone
          imagePreview={carImagePreview}
          placeholder="Click to upload your car photo"
          altText="Car preview"
          locked={vehicleLocked}
          processing={running}
          onUploadClick={onUploadClick}
          onViewImage={setLightboxSrc}
          onReplaceImage={onUploadClick}
          onRemoveImage={onRemoveCarImage}
        />
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
            disabled={vehicleLocked}
          />
        </div>
        {!vehicleLocked && (
          <div className={styles.vehicleActions}>
            <button className={styles.btnPrimary} onClick={onGenerate} disabled={!canRun}>
              {running ? 'Creating...' : 'Create My Illustration'}
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
      </div>
    </div>
  )
}
