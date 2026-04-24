'use client'

import styles from '../styles'

interface CollapsibleTweakProps {
  label: string
  isOpen: boolean
  onToggle: () => void
  disabled?: boolean
  children: React.ReactNode
}

export default function CollapsibleTweak({ label, isOpen, onToggle, disabled, children }: CollapsibleTweakProps) {
  return (
    <>
      <button
        type="button"
        className={styles.collapseToggle}
        aria-expanded={isOpen}
        onClick={onToggle}
        disabled={disabled}
      >
        <span className={styles.collapseToggleLabel}>{label}</span>
        <svg
          className={`${styles.collapseToggleChevron} ${isOpen ? styles.collapseToggleChevronOpen : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 8 10 12 14 8" />
        </svg>
      </button>
      {isOpen && children}
    </>
  )
}
