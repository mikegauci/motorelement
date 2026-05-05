'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './styles'

interface WhiteGapEraserProps {
  imageUrl: string
  onSave: (newDataUrl: string) => void
  onCancel: () => void
}


const ERASE_WHITE_THRESHOLD = 225
const FRINGE_PASSES = 2
const MATTING_BAND_PX = 3
const MATTING_ALPHA_OPAQUE = 0.96
const MATTING_ALPHA_CLEAR = 0.05

export default function WhiteGapEraser({ imageUrl, onSave, onCancel }: WhiteGapEraserProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOriginal = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsReady(false)
    setError(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { alpha: true })
      if (!ctx) {
        setError('Could not access canvas context')
        return
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      setIsReady(true)
      setHasEdits(false)
    }
    img.onerror = () => setError('Could not load artwork')
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    loadOriginal()
  }, [loadOriginal])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas || !isReady) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const cleared = floodFillWhiteToTransparent(imgData, x, y, ERASE_WHITE_THRESHOLD)
    if (cleared.size === 0) return

    cleanEdgesAroundCleared(imgData, cleared)
    ctx.putImageData(imgData, 0, 0)
    setHasEdits(true)
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL('image/png'))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4 select-none">
      <div className="text-white text-sm font-sub uppercase tracking-widest mb-1">Tap to erase</div>
      <div className="text-muted text-xs mb-4 max-w-md text-center">
        Click any white area you want to make transparent (e.g. the gap between
        a rear wing and the roof, inside open wheel arches).
      </div>
      <div
        className="relative max-w-[90vw] max-h-[60vh] flex items-center justify-center border border-border"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
          backgroundColor: '#333',
        }}
      >
        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
            Loading…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs">
            {error}
          </div>
        )}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="max-w-full max-h-[60vh] cursor-crosshair block"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" className={styles.btn} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={loadOriginal}
          disabled={!hasEdits}
        >
          Reset
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleSave}
          disabled={!hasEdits}
        >
          Done
        </button>
      </div>
    </div>
  )
}

function floodFillWhiteToTransparent(
  imgData: ImageData,
  sx: number,
  sy: number,
  threshold: number,
): Set<number> {
  const cleared = new Set<number>()
  const w = imgData.width
  const h = imgData.height
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return cleared

  const data = imgData.data
  const startP = sy * w + sx
  const startI = startP * 4

  if (data[startI + 3] === 0) return cleared
  if (
    data[startI] < threshold ||
    data[startI + 1] < threshold ||
    data[startI + 2] < threshold
  ) {
    return cleared
  }

  const visited = new Uint8Array(w * h)
  const stack: number[] = [startP]
  visited[startP] = 1

  while (stack.length > 0) {
    const p = stack.pop()!
    const i = p * 4
    if (data[i + 3] === 0) continue
    if (data[i] < threshold || data[i + 1] < threshold || data[i + 2] < threshold) {
      continue
    }

    data[i + 3] = 0
    cleared.add(p)

    const x = p % w
    const y = (p - x) / w
    if (x > 0 && !visited[p - 1]) {
      visited[p - 1] = 1
      stack.push(p - 1)
    }
    if (x < w - 1 && !visited[p + 1]) {
      visited[p + 1] = 1
      stack.push(p + 1)
    }
    if (y > 0 && !visited[p - w]) {
      visited[p - w] = 1
      stack.push(p - w)
    }
    if (y < h - 1 && !visited[p + w]) {
      visited[p + w] = 1
      stack.push(p + w)
    }
  }

  return cleared
}

function cleanEdgesAroundCleared(
  imgData: ImageData,
  cleared: Set<number>,
): void {
  if (cleared.size === 0) return
  const data = imgData.data
  const w = imgData.width
  const h = imgData.height

  const allCleared = new Set<number>(cleared)
  let frontier: Set<number> = cleared

  for (let pass = 0; pass < FRINGE_PASSES; pass++) {
    const newlyCleared = new Set<number>()
    const tryFringe = (np: number) => {
      if (allCleared.has(np)) return
      const ni = np * 4
      if (data[ni + 3] === 0) return
      if (
        data[ni] < ERASE_WHITE_THRESHOLD ||
        data[ni + 1] < ERASE_WHITE_THRESHOLD ||
        data[ni + 2] < ERASE_WHITE_THRESHOLD
      ) return
      data[ni + 3] = 0
      allCleared.add(np)
      newlyCleared.add(np)
    }
    frontier.forEach((cp) => {
      const cx = cp % w
      const cy = (cp - cx) / w
      if (cx > 0) tryFringe(cp - 1)
      if (cx < w - 1) tryFringe(cp + 1)
      if (cy > 0) tryFringe(cp - w)
      if (cy < h - 1) tryFringe(cp + w)
    })
    if (newlyCleared.size === 0) break
    frontier = newlyCleared
  }

  const inBand = new Set<number>()
  let bandFrontier: Set<number> = allCleared
  for (let pass = 0; pass < MATTING_BAND_PX; pass++) {
    const next = new Set<number>()
    const tryBand = (np: number) => {
      if (allCleared.has(np) || inBand.has(np)) return
      if (data[np * 4 + 3] === 0) return
      inBand.add(np)
      next.add(np)
    }
    bandFrontier.forEach((cp) => {
      const cx = cp % w
      const cy = (cp - cx) / w
      if (cx > 0) tryBand(cp - 1)
      if (cx < w - 1) tryBand(cp + 1)
      if (cy > 0) tryBand(cp - w)
      if (cy < h - 1) tryBand(cp + w)
    })
    if (next.size === 0) break
    bandFrontier = next
  }

  inBand.forEach((p) => {
    const i = p * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const minRGB = Math.min(r, g, b)
    const alpha = 1 - minRGB / 255

    if (alpha >= MATTING_ALPHA_OPAQUE) return
    if (alpha <= MATTING_ALPHA_CLEAR) {
      data[i + 3] = 0
      return
    }

    const bgC = (1 - alpha) * 255
    data[i] = Math.max(0, Math.min(255, Math.round((r - bgC) / alpha)))
    data[i + 1] = Math.max(0, Math.min(255, Math.round((g - bgC) / alpha)))
    data[i + 2] = Math.max(0, Math.min(255, Math.round((b - bgC) / alpha)))
    data[i + 3] = Math.round(alpha * 255)
  })
}
