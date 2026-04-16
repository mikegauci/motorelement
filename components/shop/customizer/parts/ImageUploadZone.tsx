'use client'
/* eslint-disable @next/next/no-img-element */

import styles from '../styles'

interface ImageUploadZoneProps {
  imagePreview: string | null
  placeholder: string
  altText: string
  locked?: boolean
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
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              title="View full image"
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm transition-colors"
              onClick={(e) => { e.stopPropagation(); onViewImage?.(imagePreview) }}
            >⤢</button>
            <button
              type="button"
              title="Replace image"
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm transition-colors"
              onClick={(e) => { e.stopPropagation(); if (!locked) onReplaceImage() }}
            >↻</button>
            <button
              type="button"
              title="Remove image"
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center text-sm transition-colors"
              onClick={(e) => { e.stopPropagation(); if (!locked) onRemoveImage() }}
            >✕</button>
          </div>
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
