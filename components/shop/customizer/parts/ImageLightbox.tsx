'use client'
/* eslint-disable @next/next/no-img-element */

interface ImageLightboxProps {
  src: string | null
  alt: string
  onClose: () => void
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  if (!src) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition-colors"
        onClick={onClose}
      >✕</button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
