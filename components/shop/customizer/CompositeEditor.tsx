'use client'

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
}: CompositeEditorProps) {
  const { mockupPlacement, setMockupPlacement } = useCustomizer()

  return (
    <div className={styles.compositeBlock}>
      <p className={styles.compositeLabel}>Adjust composition</p>
      <div className={styles.compositeAdjustRow}>
        <SliderRow
          label="Car vertical adjust"
          displayValue={Math.round(carAdjustYPct * 100)}
          min={-30}
          max={30}
          value={Math.round(carAdjustYPct * 100)}
          disabled={backgroundControlsLocked}
          onNudgeDown={() => setCarAdjustYPct(clampAdjust(carAdjustYPct - 0.01))}
          onNudgeUp={() => setCarAdjustYPct(clampAdjust(carAdjustYPct + 0.01))}
          onChange={(v) => setCarAdjustYPct(clampAdjust(v / 100))}
        />
        <SliderRow
          label="Car size"
          displayValue={`${Math.round(carScale * 100)}%`}
          min={70}
          max={140}
          value={Math.round(carScale * 100)}
          disabled={backgroundControlsLocked}
          onNudgeDown={() => setCarScale(clampCarScale(carScale - 0.01))}
          onNudgeUp={() => setCarScale(clampCarScale(carScale + 0.01))}
          onChange={(v) => setCarScale(clampCarScale(v / 100))}
        />
        <SliderRow
          label="Background size"
          displayValue={`${Math.round(bgScale * 100)}%`}
          min={50}
          max={140}
          value={Math.round(bgScale * 100)}
          disabled={backgroundControlsLocked}
          nudgeDownDisabled={bgScale <= 0.5}
          nudgeUpDisabled={bgScale >= 1.4}
          onNudgeDown={() => setBgScale(clampBgScale(bgScale - 0.05))}
          onNudgeUp={() => setBgScale(clampBgScale(bgScale + 0.05))}
          onChange={(v) => setBgScale(clampBgScale(v / 100))}
        />
        <SliderRow
          label="Artwork vertical"
          displayValue={Math.round((mockupPlacement.yPct - 0.5) * 100)}
          min={0}
          max={100}
          value={Math.round(mockupPlacement.yPct * 100)}
          disabled={backgroundControlsLocked}
          onNudgeDown={() => setMockupPlacement({ ...mockupPlacement, yPct: mockupPlacement.yPct - 0.01 })}
          onNudgeUp={() => setMockupPlacement({ ...mockupPlacement, yPct: mockupPlacement.yPct + 0.01 })}
          onChange={(v) => setMockupPlacement({ ...mockupPlacement, yPct: v / 100 })}
        />
        <div className={styles.compositeAdjustInputRow} style={{ gap: 8 }}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              setCarAdjustXPct(0)
              setCarAdjustYPct(0)
              setCarScale(1)
              setCompositionZoom(1)
              setBgScale(1)
              setMockupPlacement({ xPct: 0.5, yPct: 0.5, scale: 1.0 })
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
