'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from '../styles'
import { LOGO_CORNER_PRESETS, resolveCornerLogoPresetSrc } from '../constants'

interface CornerLogoPresetPickerProps {
  disabled?: boolean
  garmentColorTitle: string | null
  onSelect: (presetId: string) => void
  buttonLabel?: string
  buttonClassName?: string
  wrapperClassName?: string
}

export default function CornerLogoPresetPicker({
  disabled,
  garmentColorTitle,
  onSelect,
  buttonLabel = 'Add preset',
  buttonClassName = `${styles.printZoneImageUpload} w-full`,
  wrapperClassName = 'relative flex-1 min-w-0',
}: CornerLogoPresetPickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <div ref={rootRef} className={wrapperClassName}>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {buttonLabel}
      </button>
      {open && (
        <ul
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[min(280px,50vh)] overflow-y-auto border border-border bg-obsidian py-1 shadow-lg"
          role="menu"
        >
          {LOGO_CORNER_PRESETS.map((preset) => {
            const thumbSrc = resolveCornerLogoPresetSrc(preset.id, garmentColorTitle)
            return (
              <li key={preset.id} role="presentation">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-2 text-left text-xs font-sub font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
                  role="menuitem"
                  onClick={() => {
                    onSelect(preset.id)
                    close()
                  }}
                >
                  {thumbSrc ? (
                    <img src={thumbSrc} alt="" className="h-10 w-10 shrink-0 object-contain bg-carbon border border-border" />
                  ) : null}
                  <span>{preset.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
