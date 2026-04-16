'use client'

import type { TextLayer, FontOption } from './types'
import styles from './styles'
import SliderRow from './parts/SliderRow'

interface TextLayerEditorProps {
  textLayers: TextLayer[]
  selectedTextLayerId: string | null
  setSelectedTextLayerId: (id: string | null) => void
  selectedTextLayer: TextLayer | null
  availableFontOptions: FontOption[]
  backgroundControlsLocked: boolean
  onAddTextLayer: () => void
  onUpdateTextLayer: (layerId: string, patch: Partial<TextLayer>) => void
  onRemoveTextLayer: (layerId: string) => void
  onMoveTextLayer: (layerId: string, direction: number) => void
  onNudgeTextFontSize: (layerId: string, delta: number) => void
  onAlignTextLayerToCanvasVertical: (layerId: string, alignY: string) => void
}

export default function TextLayerEditor({
  textLayers,
  selectedTextLayerId,
  selectedTextLayer,
  availableFontOptions,
  backgroundControlsLocked,
  onAddTextLayer,
  onUpdateTextLayer,
  onRemoveTextLayer,
  onMoveTextLayer,
  onNudgeTextFontSize,
  onAlignTextLayerToCanvasVertical,
  setSelectedTextLayerId,
}: TextLayerEditorProps) {
  return (
    <div className={styles.textOverlayBlock}>
      <div className={styles.textOverlayHeader}>
        <p className={`${styles.compositeLabel} !mb-0`}>Text overlays</p>
        <button
          type="button"
          className={styles.btn}
          onClick={onAddTextLayer}
          disabled={backgroundControlsLocked}
        >
          + Add text layer
        </button>
      </div>
      {textLayers.length === 0 ? (
        <p className={styles.textOverlayEmpty}>No text layers yet.</p>
      ) : (
        <div className={styles.textLayerList}>
          {textLayers.map((layer, idx) => (
            <div
              key={layer.id}
              className={`${styles.textLayerRow} ${
                selectedTextLayerId === layer.id ? styles.textLayerRowActive : ''
              }`}
              onClick={() => setSelectedTextLayerId(layer.id)}
            >
              <span className={styles.textLayerName}>
                {idx + 1}. {layer.text.trim() || 'Untitled text'}
              </span>
              <div className={styles.textLayerActions}>
                <button
                  type="button"
                  className={styles.compositeNudgeBtn}
                  onClick={(e) => { e.stopPropagation(); onMoveTextLayer(layer.id, -1) }}
                  disabled={idx === 0 || backgroundControlsLocked}
                  aria-label="Move layer up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.compositeNudgeBtn}
                  onClick={(e) => { e.stopPropagation(); onMoveTextLayer(layer.id, 1) }}
                  disabled={idx === textLayers.length - 1 || backgroundControlsLocked}
                  aria-label="Move layer down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.compositeNudgeBtn}
                  onClick={(e) => { e.stopPropagation(); onRemoveTextLayer(layer.id) }}
                  disabled={backgroundControlsLocked}
                  aria-label="Delete layer"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedTextLayer && (
        <div className={styles.textLayerEditor}>
          <div className={styles.setupBlock}>
            <label className={styles.label}>Text</label>
            <input
              className={styles.input}
              type="text"
              value={selectedTextLayer.text}
              onChange={(e) => onUpdateTextLayer(selectedTextLayer.id, { text: e.target.value })}
              disabled={backgroundControlsLocked}
            />
          </div>
          <div className={styles.textLayerGrid}>
            <div className={styles.setupBlock}>
              <label className={styles.label}>Font family</label>
              <select
                className={styles.input}
                value={selectedTextLayer.fontFamily}
                onChange={(e) => onUpdateTextLayer(selectedTextLayer.id, { fontFamily: e.target.value })}
                disabled={backgroundControlsLocked}
              >
                {availableFontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.setupBlock}>
              <label className={styles.label}>Text color</label>
              <input
                className={styles.colorInput}
                type="color"
                value={selectedTextLayer.color}
                onChange={(e) => onUpdateTextLayer(selectedTextLayer.id, { color: e.target.value })}
                disabled={backgroundControlsLocked}
              />
            </div>
          </div>
          <div className={styles.setupBlock}>
            <SliderRow
              label="Font size"
              displayValue={`${Math.round(selectedTextLayer.fontSizePct * 100)}%`}
              min={3}
              max={25}
              value={Math.round(selectedTextLayer.fontSizePct * 100)}
              disabled={backgroundControlsLocked}
              onNudgeDown={() => onNudgeTextFontSize(selectedTextLayer.id, -0.005)}
              onNudgeUp={() => onNudgeTextFontSize(selectedTextLayer.id, 0.005)}
              onChange={(v) => onUpdateTextLayer(selectedTextLayer.id, { fontSizePct: v / 100 })}
            />
          </div>
          <div className={styles.setupBlock}>
            <label className={styles.label}>Text vertical alignment</label>
            <div className={styles.alignBtnRow}>
              {(['top', 'middle', 'bottom'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  className={`${styles.alignBtn} ${
                    selectedTextLayer.alignY === align ? styles.alignBtnActive : ''
                  }`}
                  onClick={() => onAlignTextLayerToCanvasVertical(selectedTextLayer.id, align)}
                  disabled={backgroundControlsLocked}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.setupBlock}>
            <SliderRow
              label="Vertical position"
              displayValue={Math.round(selectedTextLayer.yPct * 100)}
              min={0}
              max={100}
              value={Math.round(selectedTextLayer.yPct * 100)}
              disabled={backgroundControlsLocked}
              onNudgeDown={() => onUpdateTextLayer(selectedTextLayer.id, { yPct: Math.max(0, selectedTextLayer.yPct - 0.01) })}
              onNudgeUp={() => onUpdateTextLayer(selectedTextLayer.id, { yPct: Math.min(1, selectedTextLayer.yPct + 0.01) })}
              onChange={(v) => onUpdateTextLayer(selectedTextLayer.id, { yPct: v / 100 })}
            />
          </div>
          <div className={styles.styleRow}>
            <div className={styles.shadowSwatchGroup}>
              <label className={styles.label}>Format</label>
              <div className={styles.styleToggleGroup}>
                <button
                  type="button"
                  className={`${styles.styleToggle} ${selectedTextLayer.bold ? styles.styleToggleActive : ''}`}
                  onClick={() => onUpdateTextLayer(selectedTextLayer.id, { bold: !selectedTextLayer.bold })}
                  disabled={backgroundControlsLocked}
                  title="Bold"
                >
                  <span className={styles.styleToggleBold}>B</span>
                </button>
                <button
                  type="button"
                  className={`${styles.styleToggle} ${selectedTextLayer.italic ? styles.styleToggleActive : ''}`}
                  onClick={() => onUpdateTextLayer(selectedTextLayer.id, { italic: !selectedTextLayer.italic })}
                  disabled={backgroundControlsLocked}
                  title="Italic"
                >
                  <span className={styles.styleToggleItalic}>I</span>
                </button>
                <button
                  type="button"
                  className={`${styles.styleToggle} ${selectedTextLayer.underline ? styles.styleToggleActive : ''}`}
                  onClick={() => onUpdateTextLayer(selectedTextLayer.id, { underline: !selectedTextLayer.underline })}
                  disabled={backgroundControlsLocked}
                  title="Underline"
                >
                  <span className={styles.styleToggleUnderline}>U</span>
                </button>
              </div>
            </div>
            <div className={styles.shadowSwatchGroup}>
              <label className={styles.label}>Shadow</label>
              <div className={styles.shadowSwatches}>
                <button
                  type="button"
                  className={`${styles.shadowSwatch} ${styles.shadowSwatchOff} ${selectedTextLayer.shadow === 'off' ? styles.shadowSwatchActive : ''}`}
                  onClick={() => onUpdateTextLayer(selectedTextLayer.id, { shadow: 'off' })}
                  disabled={backgroundControlsLocked}
                  title="No shadow"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="3" y1="3" x2="13" y2="13" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                <button
                  type="button"
                  className={`${styles.shadowSwatch} ${styles.shadowSwatchBlack} ${selectedTextLayer.shadow === 'black' ? styles.shadowSwatchActive : ''}`}
                  onClick={() => onUpdateTextLayer(selectedTextLayer.id, { shadow: 'black' })}
                  disabled={backgroundControlsLocked}
                  title="Dark shadow"
                >
                  <span className={styles.shadowSwatchPreview} style={{ background: '#000' }} />
                </button>
                <button
                  type="button"
                  className={`${styles.shadowSwatch} ${styles.shadowSwatchWhite} ${selectedTextLayer.shadow === 'white' ? styles.shadowSwatchActive : ''}`}
                  onClick={() => onUpdateTextLayer(selectedTextLayer.id, { shadow: 'white' })}
                  disabled={backgroundControlsLocked}
                  title="Light shadow"
                >
                  <span className={styles.shadowSwatchPreview} style={{ background: '#fff' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
