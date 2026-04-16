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
        {isOpen ? '▼' : '►'} {label}
      </button>
      {isOpen && children}
    </>
  )
}
