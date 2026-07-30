'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './styles'
import { clampAdjust, clampCarScale, clampBgScale } from './helpers'
import { useCustomizer } from './CustomizerContext'
import SliderRow from './parts/SliderRow'

interface CompositeEditorProps {
  carAdjustYPct: number
  setCarAdjustYPct: (v: number) => void
  carScale: number
  setCarScale: (v: number) => void
  bgScale: number
  setBgScale: (v: number) => void
  setCompositionZoom: (v: number) => void
  setCarAdjustXPct: (v: number) => void
  backgroundControlsLocked: boolean
  onInViewChange?: (inView: boolean) => void
}

function useCoarseNudgeSteps() {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setCoarse(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return coarse
}

export default function CompositeEditor({
  carAdjustYPct,
  setCarAdjustYPct,
  carScale,
  setCarScale,
  bgScale,
  setBgScale,
  setCompositionZoom,
  setCarAdjustXPct,
  backgroundControlsLocked,
  onInViewChange,
}: CompositeEditorProps) {
  const { mockupPlacement, setMockupPlacement, artworkSide, setMockupViewSide } = useCustomizer()
  const rootRef = useRef<HTMLDivElement>(null)
  const coarseSteps = useCoarseNudgeSteps()

  const positionStep = coarseSteps ? 0.03 : 0.01
  const carScaleStep = coarseSteps ? 0.05 : 0.01
  const bgScaleStep = 0.05

  function showArtworkSide() {
    setMockupViewSide(artworkSide)
  }

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => onInViewChange?.(entry.isIntersecting),
      { threshold: 0.2, rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      onInViewChange?.(false)
    }
  }, [onInViewChange])

  return (
    <div ref={rootRef} className={styles.compositeBlock}>
      <p className={styles.compositeLabel}>Adjust composition</p>
      <div className={styles.compositeAdjustRow}>
        <div className={styles.compositeAdjustGroupGrid}>
          <SliderRow
            label="Car vertical"
            displayValue={Math.round(carAdjustYPct * 100)}
            min={-50}
            max={50}
            value={Math.round(carAdjustYPct * 100)}
            disabled={backgroundControlsLocked}
            onNudgeDown={() => {
              showArtworkSide()
              setCarAdjustYPct(clampAdjust(carAdjustYPct - positionStep))
            }}
            onNudgeUp={() => {
              showArtworkSide()
              setCarAdjustYPct(clampAdjust(carAdjustYPct + positionStep))
            }}
            onChange={(v) => {
              showArtworkSide()
              setCarAdjustYPct(clampAdjust(v / 100))
            }}
          />
          <SliderRow
            label="Car size"
            displayValue={`${Math.round(carScale * 100)}%`}
            min={70}
            max={130}
            value={Math.round(carScale * 100)}
            disabled={backgroundControlsLocked}
            onNudgeDown={() => {
              showArtworkSide()
              setCarScale(clampCarScale(carScale - carScaleStep))
            }}
            onNudgeUp={() => {
              showArtworkSide()
              setCarScale(clampCarScale(carScale + carScaleStep))
            }}
            onChange={(v) => {
              showArtworkSide()
              setCarScale(clampCarScale(v / 100))
            }}
          />
          <SliderRow
            label="Background size"
            displayValue={`${Math.round(bgScale * 100)}%`}
            min={80}
            max={120}
            value={Math.round(bgScale * 100)}
            disabled={backgroundControlsLocked}
            nudgeDownDisabled={bgScale <= 0.8}
            nudgeUpDisabled={bgScale >= 1.2}
            onNudgeDown={() => {
              showArtworkSide()
              setBgScale(clampBgScale(bgScale - bgScaleStep))
            }}
            onNudgeUp={() => {
              showArtworkSide()
              setBgScale(clampBgScale(bgScale + bgScaleStep))
            }}
            onChange={(v) => {
              showArtworkSide()
              setBgScale(clampBgScale(v / 100))
            }}
          />
          <SliderRow
            label="Artwork vertical"
            displayValue={Math.round((mockupPlacement.yPct - 0.5) * 100)}
            min={0}
            max={100}
            value={Math.round(mockupPlacement.yPct * 100)}
            disabled={backgroundControlsLocked}
            onNudgeDown={() => {
              showArtworkSide()
              setMockupPlacement({ ...mockupPlacement, yPct: mockupPlacement.yPct - positionStep })
            }}
            onNudgeUp={() => {
              showArtworkSide()
              setMockupPlacement({ ...mockupPlacement, yPct: mockupPlacement.yPct + positionStep })
            }}
            onChange={(v) => {
              showArtworkSide()
              setMockupPlacement({ ...mockupPlacement, yPct: v / 100 })
            }}
          />
        </div>

        <div className={styles.compositeAdjustInputRow} style={{ gap: 8 }}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              showArtworkSide()
              setCarAdjustXPct(0)
              setCarAdjustYPct(0)
              setCarScale(1)
              setCompositionZoom(1)
              setBgScale(1)
              setMockupPlacement({
                xPct: 0.5,
                yPct: 0.5,
                scale: 1,
              })
            }}
            disabled={backgroundControlsLocked}
          >
            Reset all
          </button>
        </div>
      </div>
    </div>
  )
}
