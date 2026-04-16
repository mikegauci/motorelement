'use client'

import { useState } from 'react'
import styles from './styles'
import ImageUploadZone from './parts/ImageUploadZone'
import ImageLightbox from './parts/ImageLightbox'

interface VehicleInputFormProps {
  carModel: string
  setCarModel: (v: string) => void
  showNumberPlate: boolean
  setShowNumberPlate: (v: boolean) => void
  numberPlate: string
  setNumberPlate: (v: string) => void
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
  carModel,
  setCarModel,
  showNumberPlate,
  setShowNumberPlate,
  numberPlate,
  setNumberPlate,
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
          onUploadClick={onUploadClick}
          onViewImage={setLightboxSrc}
          onReplaceImage={onUploadClick}
          onRemoveImage={onRemoveCarImage}
        />
      </div>

      <ImageLightbox src={lightboxSrc} alt="Full car preview" onClose={() => setLightboxSrc(null)} />

      <div className={styles.vehicleFields}>
        <div className={styles.setupBlock}>
          <label className={styles.label}>Car model and year</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Honda NSX 1991"
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            disabled={vehicleLocked}
          />
        </div>
        <div className={styles.setupBlock}>
          <label className={styles.label}>Show number plate?</label>
          <div className={styles.radioRow}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="showNumberPlate"
                checked={!showNumberPlate}
                onChange={() => { setShowNumberPlate(false); setNumberPlate('') }}
                disabled={vehicleLocked}
              />
              No
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="showNumberPlate"
                checked={showNumberPlate}
                onChange={() => setShowNumberPlate(true)}
                disabled={vehicleLocked}
              />
              Yes
            </label>
          </div>
          {showNumberPlate && (
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. ABC 123"
              value={numberPlate}
              onChange={(e) => setNumberPlate(e.target.value)}
              disabled={vehicleLocked}
            />
          )}
        </div>
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
              {running ? 'Generating…' : 'Generate illustration'}
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
