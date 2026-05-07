'use client'

import Image from 'next/image'
import type { TextLayer, FontOption, PrintZoneCorner, PrintZoneCornerImage } from './types'
import styles from './styles'
import SliderRow from './parts/SliderRow'
import CornerLogoPresetPicker from './parts/CornerLogoPresetPicker'

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
  getPrintZoneCornerPosition: (corner: PrintZoneCorner) => { xPct: number; yPct: number } | null
  printZoneCornerImage: PrintZoneCornerImage
  onUpdatePrintZoneCornerImage: (patch: Partial<PrintZoneCornerImage>) => void
  onUploadCornerImage: () => void
  onRemoveCornerImage: () => void
  garmentColorTitle: string | null
  onApplyCornerPreset: (presetId: string) => void
}

const CORNER_OPTIONS: Array<{ value: PrintZoneCorner; label: string }> = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
]

function CornerIcon({ corner }: { corner: PrintZoneCorner }) {
  const left = corner.endsWith('left')
  const top = corner.startsWith('top')
  const x = left ? 4 : 12
  const y = top ? 4 : 12
  const hLine = left
    ? { x1: 4, y1: y, x2: 10, y2: y }
    : { x1: 6, y1: y, x2: 12, y2: y }
  const vLine = top
    ? { x1: x, y1: 4, x2: x, y2: 10 }
    : { x1: x, y1: 6, x2: x, y2: 12 }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <line {...hLine} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line {...vLine} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx={x} cy={y} r="1.75" fill="currentColor" />
    </svg>
  )
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
  getPrintZoneCornerPosition,
  printZoneCornerImage,
  onUpdatePrintZoneCornerImage,
  onUploadCornerImage,
  onRemoveCornerImage,
  garmentColorTitle,
  onApplyCornerPreset,
  setSelectedTextLayerId,
}: TextLayerEditorProps) {
  function setPrintZoneCorner(layer: TextLayer, corner: PrintZoneCorner) {
    const position = getPrintZoneCornerPosition(corner)
    onUpdateTextLayer(layer.id, {
      printZoneCorner: corner,
      ...(position ?? {}),
    })
  }

  function togglePrintZoneCorner(layer: TextLayer) {
    const enabled = !layer.printZoneCorner
    if (!enabled) {
      onUpdateTextLayer(layer.id, {
        printZoneCorner: null,
        xPct: layer.printZonePreviousXPct ?? 0.5,
        yPct: layer.printZonePreviousYPct ?? 0.2,
        printZonePreviousXPct: undefined,
        printZonePreviousYPct: undefined,
      })
      return
    }
    const corner = layer.printZoneCorner ?? 'top-right'
    const position = getPrintZoneCornerPosition(corner)
    onUpdateTextLayer(layer.id, {
      printZoneCorner: corner,
      printZonePreviousXPct: layer.xPct,
      printZonePreviousYPct: layer.yPct,
      ...(position ?? {}),
    })
  }

  function setCornerImageCorner(corner: PrintZoneCorner) {
    onUpdatePrintZoneCornerImage({ corner })
  }

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
          <div className={styles.textLayerTextFontRow}>
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
            <div className={styles.setupBlock}>
              <label className={styles.label}>Font style</label>
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
          </div>
          <div className={styles.textLayerColorStyleRow}>
            <div className={styles.setupBlock}>
              <label className={styles.label}>Color</label>
              <input
                className={styles.colorInput}
                type="color"
                value={selectedTextLayer.color}
                onChange={(e) => onUpdateTextLayer(selectedTextLayer.id, { color: e.target.value })}
                disabled={backgroundControlsLocked}
              />
            </div>
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
          {!selectedTextLayer.printZoneCorner && (
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
          )}
          <div className={styles.setupBlock}>
            <button
              type="button"
              className={`${styles.printZoneCheckboxLabel} ${selectedTextLayer.printZoneCorner ? styles.printZoneCheckboxLabelActive : ''}`}
              onClick={() => togglePrintZoneCorner(selectedTextLayer)}
              disabled={backgroundControlsLocked}
            >
              <input
                type="checkbox"
                className={styles.printZoneCheckbox}
                checked={!!selectedTextLayer.printZoneCorner}
                readOnly
                tabIndex={-1}
              />
              <span>Add text in corner?</span>
            </button>
            {selectedTextLayer.printZoneCorner && (
              <div className={styles.printZoneCornerGrid}>
                {CORNER_OPTIONS.map((corner) => (
                  <button
                    key={corner.value}
                    type="button"
                    className={`${styles.printZoneCornerBtn} ${selectedTextLayer.printZoneCorner === corner.value ? styles.printZoneCornerBtnActive : ''}`}
                    onClick={() => setPrintZoneCorner(selectedTextLayer, corner.value)}
                    disabled={backgroundControlsLocked}
                    aria-label={corner.label}
                    title={corner.label}
                  >
                    <CornerIcon corner={corner.value} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.setupBlock}>
            <button
              type="button"
              className={`${styles.printZoneCheckboxLabel} ${printZoneCornerImage.enabled ? styles.printZoneCheckboxLabelActive : ''}`}
              onClick={() => onUpdatePrintZoneCornerImage({ enabled: !printZoneCornerImage.enabled })}
              disabled={backgroundControlsLocked}
            >
              <input
                type="checkbox"
                className={styles.printZoneCheckbox}
                checked={printZoneCornerImage.enabled}
                readOnly
                tabIndex={-1}
              />
              <span>Add image in corner?</span>
            </button>
            {printZoneCornerImage.enabled && (
              <>
                {printZoneCornerImage.src ? (
                  <div className={styles.printZoneImagePreviewRow}>
                    <Image
                      src={printZoneCornerImage.src}
                      alt="Corner image"
                      width={64}
                      height={64}
                      unoptimized
                      className={styles.printZoneImagePreview}
                    />
                    <div className={styles.printZoneImageActions}>
                      {printZoneCornerImage.presetId ? (
                        <CornerLogoPresetPicker
                          disabled={backgroundControlsLocked}
                          garmentColorTitle={garmentColorTitle}
                          onSelect={onApplyCornerPreset}
                          buttonLabel="Replace preset"
                          buttonClassName={styles.btn}
                          wrapperClassName="relative"
                        />
                      ) : (
                        <button
                          type="button"
                          className={styles.btn}
                          onClick={onUploadCornerImage}
                          disabled={backgroundControlsLocked}
                        >
                          Replace image
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btn}
                        onClick={onRemoveCornerImage}
                        disabled={backgroundControlsLocked}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`${styles.printZoneImageUpload} flex-1 min-w-0`}
                      onClick={onUploadCornerImage}
                      disabled={backgroundControlsLocked}
                    >
                      Upload corner image
                    </button>
                    <CornerLogoPresetPicker
                      disabled={backgroundControlsLocked}
                      garmentColorTitle={garmentColorTitle}
                      onSelect={onApplyCornerPreset}
                    />
                  </div>
                )}
                {printZoneCornerImage.src && (
                  <>
                    <div className={styles.printZoneCornerGrid}>
                      {CORNER_OPTIONS.map((corner) => (
                        <button
                          key={corner.value}
                          type="button"
                          className={`${styles.printZoneCornerBtn} ${printZoneCornerImage.corner === corner.value ? styles.printZoneCornerBtnActive : ''}`}
                          onClick={() => setCornerImageCorner(corner.value)}
                          disabled={backgroundControlsLocked}
                          aria-label={corner.label}
                          title={corner.label}
                        >
                          <CornerIcon corner={corner.value} />
                        </button>
                      ))}
                    </div>
                    <SliderRow
                      label="Image size"
                      displayValue={`${Math.round(printZoneCornerImage.sizePct * 100)}%`}
                      min={5}
                      max={35}
                      value={Math.round(printZoneCornerImage.sizePct * 100)}
                      disabled={backgroundControlsLocked}
                      onNudgeDown={() => onUpdatePrintZoneCornerImage({ sizePct: printZoneCornerImage.sizePct - 0.01 })}
                      onNudgeUp={() => onUpdatePrintZoneCornerImage({ sizePct: printZoneCornerImage.sizePct + 0.01 })}
                      onChange={(v) => onUpdatePrintZoneCornerImage({ sizePct: v / 100 })}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
