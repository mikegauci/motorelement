'use client'

import styles from '../styles'

interface SliderRowProps {
  label: string
  displayValue: string | number
  min: number
  max: number
  value: number
  disabled?: boolean
  onNudgeDown: () => void
  onNudgeUp: () => void
  onChange: (value: number) => void
  nudgeDownDisabled?: boolean
  nudgeUpDisabled?: boolean
}

export default function SliderRow({
  label,
  displayValue,
  min,
  max,
  value,
  disabled,
  onNudgeDown,
  onNudgeUp,
  onChange,
  nudgeDownDisabled,
  nudgeUpDisabled,
}: SliderRowProps) {
  return (
    <div className={styles.compositeAdjustControl}>
      <div className={styles.compositeAdjustHead}>
        <span>{label}</span>
        <span className={styles.compositeAdjustValue}>{displayValue}</span>
      </div>
      <div className={styles.compositeAdjustInputRow}>
        <button
          type="button"
          className={styles.compositeNudgeBtn}
          onClick={onNudgeDown}
          disabled={disabled || nudgeDownDisabled}
        >
          -
        </button>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
        />
        <button
          type="button"
          className={styles.compositeNudgeBtn}
          onClick={onNudgeUp}
          disabled={disabled || nudgeUpDisabled}
        >
          +
        </button>
      </div>
    </div>
  )
}
