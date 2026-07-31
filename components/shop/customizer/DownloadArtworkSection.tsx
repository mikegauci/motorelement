'use client'

import styles from './styles'
import {
  DOWNLOAD_ARTWORK_LABEL,
  formatDownloadArtworkPrice,
} from '@/lib/shop/downloadArtwork'

interface DownloadArtworkSectionProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

export default function DownloadArtworkSection({
  enabled,
  onChange,
  disabled = false,
}: DownloadArtworkSectionProps) {
  const options: { value: boolean; label: string }[] = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ]

  return (
    <section className={styles.presetSection} aria-label="Download artwork">
      <h2 className={styles.presetSectionTitle}>Download Artwork?</h2>
      <p className={styles.presetSectionIntro}>
        Get a high-resolution digital copy ({DOWNLOAD_ARTWORK_LABEL}) for{' '}
        {formatDownloadArtworkPrice()}. Available after checkout.
      </p>
      <div className="flex gap-2">
        {options.map((opt) => {
          const isActive = enabled === opt.value
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              aria-pressed={isActive}
              className={`h-10 min-w-[120px] px-5 text-xs font-sub font-bold uppercase tracking-widest border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? 'border-ignition bg-ignition/10 text-white'
                  : 'border-border bg-carbon text-muted hover:border-white/30 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
