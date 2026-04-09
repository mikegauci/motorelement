import type { BackgroundPreset, FontOption } from './types'

export const SESSION_KEY = 'car-vector-session-v1'
export const PENDING_GENERATION_KEY = 'car-vector-pending-generation-v1'
export const PENDING_BACKGROUND_KEY = 'car-vector-pending-background-v1'

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'retrowave-ii', name: 'Retrowave', src: '/presets/retrowave-ii.png' },
  { id: 'torii-gate', name: 'Torii gate', src: '/presets/torii-gate.png' },
]

export const CUSTOM_BACKGROUND_NEW = 'custom-new'
export const CUSTOM_BACKGROUND_PREFIX = 'custom-'

/**
 * Preset art is scaled inside the square; the car is scaled to the same width as that
 * layer so it matches the circular artwork diameter (not full canvas width).
 */
export const COMPOSITE = {
  bgWidthPct: 0.74,
  bgTopPct: 0.055,
  carLiftPct: 0.11,
  exportSize: 4096,
}

export const CORNER_CLEAR_RADIUS_FR = 0.49

export const TEXT_FONTS: FontOption[] = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
]

/**
 * Print zone on the t-shirt mockup (fraction of image dimensions).
 * Matches Printify Gildan 64000 front print area: 3852 × 4398 px (portrait).
 */
export const MOCKUP_PRINT_ZONE = {
  xPct: 0.27,
  yPct: 0.17,
  widthPct: 0.46,
  heightPct: 0.53,
}

/** Printify Gildan 64000 front print area in pixels. */
export const PRINTIFY_PRINT_AREA = { width: 3852, height: 4398 }
