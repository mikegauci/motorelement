'use client'

import styles from './styles'
import type { TextPlacement } from './CustomizerContext'

interface TextPlacementSelectorProps {
  placement: TextPlacement
  onChange: (p: TextPlacement) => void
  disabled?: boolean
}

export default function TextPlacementSelector({
  placement,
  onChange,
  disabled = false,
}: TextPlacementSelectorProps) {
  const options: { value: TextPlacement; label: string }[] = [
    { value: 'same', label: 'Same Side' },
    { value: 'opposite', label: 'Opposite' },
  ]

  return (
    <section className={styles.presetSection} aria-label="Text placement">
      <h2 className={styles.presetSectionTitle}>Text Placement</h2>
      <p className={styles.presetSectionIntro}>
        Would you like to keep the text on the same side as the artwork, or on
        the opposite side?
      </p>
      <div className="flex gap-2">
        {options.map((opt) => {
          const isActive = placement === opt.value
          return (
            <button
              key={opt.value}
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
