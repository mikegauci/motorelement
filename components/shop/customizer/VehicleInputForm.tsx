'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import styles from './styles'

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
        <div
          className={`${styles.uploadZone} ${carImagePreview ? styles.hasImage : ''} relative`}
          onClick={() => { if (!carImagePreview && !vehicleLocked) onUploadClick() }}
        >
          {carImagePreview ? (
            <>
              <img src={carImagePreview} alt="Car preview" className={styles.preview} />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  type="button"
                  title="View full image"
                  className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm transition-colors"
                  onClick={(e) => { e.stopPropagation(); setLightboxSrc(carImagePreview) }}
                >⤢</button>
                <button
                  type="button"
                  title="Replace image"
                  className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm transition-colors"
                  onClick={(e) => { e.stopPropagation(); if (!vehicleLocked) onUploadClick() }}
                >↻</button>
                <button
                  type="button"
                  title="Remove image"
                  className="w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center text-sm transition-colors"
                  onClick={(e) => { e.stopPropagation(); if (!vehicleLocked) onRemoveCarImage() }}
                >✕</button>
              </div>
            </>
          ) : (
            <div className={styles.uploadPlaceholder}>
              <span className={styles.uploadIcon}>↑</span>
              <span>Click to upload your car photo</span>
            </div>
          )}
        </div>
      </div>

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
            alt="Full car preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
