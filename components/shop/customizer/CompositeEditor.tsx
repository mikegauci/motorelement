'use client'

import styles from './styles'
import { clampAdjust, clampCarScale } from './helpers'
import { useCustomizer } from './CustomizerContext'

interface CompositeEditorProps {
  carAdjustYPct: number
  setCarAdjustYPct: (v: number) => void
  carScale: number
  setCarScale: (v: number) => void
  setCompositionZoom: (v: number) => void
  setCarAdjustXPct: (v: number) => void
  backgroundControlsLocked: boolean
}

export default function CompositeEditor({
  carAdjustYPct,
  setCarAdjustYPct,
  carScale,
  setCarScale,
  setCompositionZoom,
  setCarAdjustXPct,
  backgroundControlsLocked,
}: CompositeEditorProps) {
  const { mockupPlacement, setMockupPlacement } = useCustomizer()
  function nudgeCarAdjustY(deltaPct: number) {
    setCarAdjustYPct(clampAdjust(carAdjustYPct + deltaPct))
  }
  function nudgeCarScale(delta: number) {
    setCarScale(clampCarScale(carScale + delta))
  }

  return (
    <div className={styles.compositeBlock}>
      <p className={styles.compositeLabel}>Adjust composition</p>
      <div className={styles.compositeAdjustRow}>
        <div className={styles.compositeAdjustControl}>
          <div className={styles.compositeAdjustHead}>
            <span>Car vertical adjust</span>
            <span className={styles.compositeAdjustValue}>
              {Math.round(carAdjustYPct * 100)}
            </span>
          </div>
          <div className={styles.compositeAdjustInputRow}>
            <button
              type="button"
              className={styles.compositeNudgeBtn}
              onClick={() => nudgeCarAdjustY(-0.01)}
              disabled={backgroundControlsLocked}
            >
              -
            </button>
            <input
              type="range"
              min={-30}
              max={30}
              value={Math.round(carAdjustYPct * 100)}
              onChange={(e) => setCarAdjustYPct(clampAdjust(Number(e.target.value) / 100))}
              disabled={backgroundControlsLocked}
            />
            <button
              type="button"
              className={styles.compositeNudgeBtn}
              onClick={() => nudgeCarAdjustY(0.01)}
              disabled={backgroundControlsLocked}
            >
              +
            </button>
          </div>
        </div>
        <div className={styles.compositeAdjustControl}>
          <div className={styles.compositeAdjustHead}>
            <span>Car size</span>
            <span className={styles.compositeAdjustValue}>
              {Math.round(carScale * 100)}%
            </span>
          </div>
          <div className={styles.compositeAdjustInputRow}>
            <button
              type="button"
              className={styles.compositeNudgeBtn}
              onClick={() => nudgeCarScale(-0.01)}
              disabled={backgroundControlsLocked}
            >
              -
            </button>
            <input
              type="range"
              min={70}
              max={140}
              value={Math.round(carScale * 100)}
              onChange={(e) => setCarScale(clampCarScale(Number(e.target.value) / 100))}
              disabled={backgroundControlsLocked}
            />
            <button
              type="button"
              className={styles.compositeNudgeBtn}
              onClick={() => nudgeCarScale(0.01)}
              disabled={backgroundControlsLocked}
            >
              +
            </button>
          </div>
        </div>
        <div className={styles.compositeAdjustControl}>
          <div className={styles.compositeAdjustHead}>
            <span>Artwork on mockup</span>
            <span className={styles.compositeAdjustValue}>
              {Math.round(mockupPlacement.scale * 100)}%
            </span>
          </div>
          <div className={styles.compositeAdjustInputRow}>
            <button
              type="button"
              className={styles.compositeNudgeBtn}
              onClick={() => setMockupPlacement({ ...mockupPlacement, scale: mockupPlacement.scale - 0.05 })}
              disabled={backgroundControlsLocked || mockupPlacement.scale <= 0.1}
            >
              -
            </button>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(mockupPlacement.scale * 100)}
              onChange={(e) => setMockupPlacement({ ...mockupPlacement, scale: Number(e.target.value) / 100 })}
              disabled={backgroundControlsLocked}
            />
            <button
              type="button"
              className={styles.compositeNudgeBtn}
              onClick={() => setMockupPlacement({ ...mockupPlacement, scale: mockupPlacement.scale + 0.05 })}
              disabled={backgroundControlsLocked || mockupPlacement.scale >= 1.0}
            >
              +
            </button>
          </div>
        </div>
        <div className={styles.compositeAdjustControl}>
          <div className={styles.compositeAdjustHead}>
            <span>Artwork vertical</span>
            <span className={styles.compositeAdjustValue}>
              {Math.round((mockupPlacement.yPct - 0.5) * 100)}
            </span>
          </div>
          <div className={styles.compositeAdjustInputRow}>
            <button
              type="button"
              className={styles.compositeNudgeBtn}
              onClick={() => setMockupPlacement({ ...mockupPlacement, yPct: mockupPlacement.yPct - 0.01 })}
              disabled={backgroundControlsLocked}
            >
              -
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(mockupPlacement.yPct * 100)}
              onChange={(e) => setMockupPlacement({ ...mockupPlacement, yPct: Number(e.target.value) / 100 })}
              disabled={backgroundControlsLocked}
            />
            <button
              type="button"
              className={styles.compositeNudgeBtn}
              onClick={() => setMockupPlacement({ ...mockupPlacement, yPct: mockupPlacement.yPct + 0.01 })}
              disabled={backgroundControlsLocked}
            >
              +
            </button>
          </div>
        </div>
        <div className={styles.compositeAdjustInputRow} style={{ gap: 8 }}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              setCarAdjustXPct(0)
              setCarAdjustYPct(0)
            }}
            disabled={backgroundControlsLocked}
          >
            Center align
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              setCarAdjustXPct(0)
              setCarAdjustYPct(0)
              setCarScale(1)
              setCompositionZoom(1)
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
