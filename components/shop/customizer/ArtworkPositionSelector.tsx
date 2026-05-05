'use client'

import styles from './styles'
import type { ArtworkSide } from './CustomizerContext'

interface ArtworkPositionSelectorProps {
  artworkSide: ArtworkSide
  setArtworkSide: (side: ArtworkSide) => void
  disabled?: boolean
}

export default function ArtworkPositionSelector({
  artworkSide,
  setArtworkSide,
  disabled = false,
}: ArtworkPositionSelectorProps) {
  const sides: ArtworkSide[] = ['front', 'back']

  return (
    <section
      className={styles.presetSection}
      aria-label="Select artwork position"
    >
      <h2 className={styles.presetSectionTitle}>Select Artwork Position</h2>
      <p className={styles.presetSectionIntro}>
        Where would you like this artwork to be positioned which includes the
        vehicle and background, on the front or at the back of the apparel?
      </p>
      <div className="flex gap-2">
        {sides.map((side) => {
          const isActive = artworkSide === side
          return (
            <button
              key={side}
              type="button"
              onClick={() => setArtworkSide(side)}
              disabled={disabled}
              aria-pressed={isActive}
              className={`h-10 min-w-[120px] px-5 text-xs font-sub font-bold uppercase tracking-widest border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? 'border-ignition bg-ignition/10 text-white'
                  : 'border-border bg-carbon text-muted hover:border-white/30 hover:text-white'
              }`}
            >
              {side === 'front' ? 'Front' : 'Back'}
            </button>
          )
        })}
      </div>
    </section>
  )
}
