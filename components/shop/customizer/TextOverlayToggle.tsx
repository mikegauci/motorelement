'use client'

import styles from './styles'

interface TextOverlayToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

export default function TextOverlayToggle({
  enabled,
  onChange,
  disabled = false,
}: TextOverlayToggleProps) {
  const options: { value: boolean; label: string }[] = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ]

  return (
    <section className={styles.presetSection} aria-label="Add text">
      <h2 className={styles.presetSectionTitle}>Add Text?</h2>
      <p className={styles.presetSectionIntro}>
        Choose if you would like to add text or not
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
