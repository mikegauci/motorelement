import type { BackgroundPreset, FontOption, PrintSide } from './types'

export const SESSION_KEY = 'car-vector-session-v1'
export const PENDING_GENERATION_KEY_FRONT = 'car-vector-pending-generation-front-v1'
export const PENDING_GENERATION_KEY_BACK = 'car-vector-pending-generation-back-v1'
export const PENDING_BACKGROUND_KEY = 'car-vector-pending-background-v1'

export function pendingGenerationKeyForSide(side: PrintSide): string {
  return side === 'front' ? PENDING_GENERATION_KEY_FRONT : PENDING_GENERATION_KEY_BACK
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'cyberpunk', name: 'Cyberpunk', src: '/presets/cyberpunk.png' },
  { id: 'daikouku', name: 'Daikouku', src: '/presets/daikouku.png' },
  { id: 'daytona-beach', name: 'Daytona Beach', src: '/presets/daytona-beach.png' },
  { id: 'dystopia', name: 'Dystopia', src: '/presets/dystopia.png' },
  { id: 'eternal-path', name: 'Eternal Path', src: '/presets/eternal-path.png' },
  { id: 'forest', name: 'Forest', src: '/presets/forest.png' },
  { id: 'godzilla', name: 'Godzilla', src: '/presets/godzilla.png' },
  { id: 'las-vegas', name: 'Las Vegas', src: '/presets/las-vegas.png' },
  { id: 'london', name: 'London', src: '/presets/london.png' },
  { id: 'miami', name: 'Miami', src: '/presets/miami.png' },
  { id: 'mount-fuji', name: 'Mount Fuji', src: '/presets/mount-fuji.png' },
  { id: 'mountain-pass', name: 'Mountain Pass', src: '/presets/mountain-pass.png' },
  { id: 'new-york', name: 'New York', src: '/presets/new-york.png' },
  { id: 'racetrack', name: 'Racetrack', src: '/presets/racetrack.png' },
  { id: 'retrowave', name: 'Retrowave', src: '/presets/retrowave.png' },
  { id: 'sakura', name: 'Sakura', src: '/presets/sakura.png' },
  { id: 'sand-dunes', name: 'Sand Dunes', src: '/presets/sand-dunes.png' },
  { id: 'shibuya-crossing', name: 'Shibuya Crossing', src: '/presets/shibuya-crossing.png' },
  { id: 'synthwave', name: 'Synthwave', src: '/presets/synthwave.png' },
  { id: 'touge', name: 'Touge', src: '/presets/touge.png' },
  { id: 'vaporwave', name: 'Vaporwave', src: '/presets/vaporwave.png' },
  { id: 'wangan', name: 'Wangan', src: '/presets/wangan.png' },
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
 * Per-color blank garment mockup images used by the Live Mockup tab instead
 * of Printify's images (which contain "Custom Print" placeholder text).
 * Keyed by product type → side → colour slug → image path in public/.
 *
 * To enable local back blanks (better quality than Printify's stock images):
 *   1. Drop PNGs into:
 *      public/images/mockups/t-shirt/back-{white,black,grey,navy}-t-shirt.png
 *      public/images/mockups/hoodie/back-{white,black,grey,navy}-hoodie.png
 *   2. Uncomment the matching entries in the `back:` maps below.
 *
 * While those files are missing, the customizer falls back to the Printify
 * back image (already in `currentImages.back` from the product API).
 */
const BLANK_MOCKUP_IMAGES: Record<string, Record<PrintSide, Record<string, string>>> = {
  't-shirt': {
    front: {
      white: '/images/mockups/t-shirt/front-white-t-shirt.png',
      black: '/images/mockups/t-shirt/front-black-t-shirt.png',
      grey:  '/images/mockups/t-shirt/front-grey-t-shirt.png',
      navy:  '/images/mockups/t-shirt/front-navy-t-shirt.png',
    },
    back: {
      // white: '/images/mockups/t-shirt/back-white-t-shirt.png',
      // black: '/images/mockups/t-shirt/back-black-t-shirt.png',
      // grey:  '/images/mockups/t-shirt/back-grey-t-shirt.png',
      // navy:  '/images/mockups/t-shirt/back-navy-t-shirt.png',
    },
  },
  hoodie: {
    front: {
      white: '/images/mockups/hoodie/front-white-hoodie.png',
      black: '/images/mockups/hoodie/front-black-hoodie.png',
      grey:  '/images/mockups/hoodie/front-grey-hoodie.png',
      navy:  '/images/mockups/hoodie/front-navy-hoodie.png',
    },
    back: {
      // white: '/images/mockups/hoodie/back-white-hoodie.png',
      // black: '/images/mockups/hoodie/back-black-hoodie.png',
      // grey:  '/images/mockups/hoodie/back-grey-hoodie.png',
      // navy:  '/images/mockups/hoodie/back-navy-hoodie.png',
    },
  },
}

const COLOR_TITLE_TO_SLUG: Record<string, string> = {
  'sport grey': 'grey',
  'sport gray': 'grey',
  'dark heather': 'grey',
}

function colorSlug(title: string): string {
  const lower = title.toLowerCase().trim()
  return COLOR_TITLE_TO_SLUG[lower] ?? lower.replace(/\s+/g, '-')
}

/**
 * Look up a blank mockup image for a given product type, colour, and side.
 * Returns the image path if a matching file exists, or `null` (caller falls
 * back to the Printify image for that side).
 */
export function getBlankMockupImage(
  productType?: string,
  colorTitle?: string,
  side: PrintSide = 'front',
): string | null {
  const typeMap = BLANK_MOCKUP_IMAGES[productType ?? '']
  if (!typeMap) return null
  const sideMap = typeMap[side]
  if (!sideMap) return null
  if (!colorTitle) return Object.values(sideMap)[0] ?? null
  const slug = colorSlug(colorTitle)
  return sideMap[slug] ?? null
}

/**
 * Print zone on the product mockup (fraction of image dimensions).
 * Must visually match where Printify places the print on the garment.
 * Back zones start identical to front; tune visually once back blanks land.
 */
const MOCKUP_PRINT_ZONES: Record<
  string,
  Record<PrintSide, { xPct: number; yPct: number; widthPct: number; heightPct: number }>
> = {
  't-shirt': {
    front: { xPct: 0.38, yPct: 0.28, widthPct: 0.25, heightPct: 0.28 },
    back:  { xPct: 0.38, yPct: 0.22, widthPct: 0.25, heightPct: 0.32 },
  },
  hoodie: {
    front: { xPct: 0.36, yPct: 0.35, widthPct: 0.25, heightPct: 0.23 },
    back:  { xPct: 0.36, yPct: 0.18, widthPct: 0.28, heightPct: 0.40 },
  },
}

const DEFAULT_MOCKUP_PRINT_ZONE = MOCKUP_PRINT_ZONES['t-shirt'].front

export function getMockupPrintZone(productType?: string, side: PrintSide = 'front') {
  return MOCKUP_PRINT_ZONES[productType ?? '']?.[side] ?? DEFAULT_MOCKUP_PRINT_ZONE
}

/** Printify print area in pixels, per product type and side (from Printify API). */
const PRINT_AREAS: Record<string, Record<PrintSide, { width: number; height: number }>> = {
  't-shirt': {
    front: { width: 3852, height: 4398 },
    back:  { width: 3852, height: 4398 },
  },
  hoodie: {
    front: { width: 3709, height: 2472 },
    back:  { width: 3709, height: 2472 },
  },
}

const DEFAULT_PRINT_AREA = PRINT_AREAS['t-shirt'].front

export function getPrintifyPrintArea(productType?: string, side: PrintSide = 'front') {
  return PRINT_AREAS[productType ?? '']?.[side] ?? DEFAULT_PRINT_AREA
}

/**
 * Scale factor applied when building the print file for Printify.
 * The mockup scale (0–1) is multiplied by this to fit the artwork
 * within the actual print area without overflowing.
 */
const PRINT_SCALE_FACTOR: Record<string, Record<PrintSide, number>> = {
  't-shirt': { front: 0.75, back: 0.75 },
  hoodie:    { front: 0.47, back: 0.47 },
}

export function getPrintScaleFactor(productType?: string, side: PrintSide = 'front'): number {
  return PRINT_SCALE_FACTOR[productType ?? '']?.[side] ?? 0.75
}

/**
 * Vertical pixel offset applied to the artwork in the Printify print file.
 * Negative = shift up, positive = shift down.
 */
const PRINT_Y_OFFSET_PX: Record<string, Record<PrintSide, number>> = {
  't-shirt': { front: -750, back: -750 },
  hoodie:    { front: 100,  back: 100 },
}

export function getPrintYOffsetPx(productType?: string, side: PrintSide = 'front'): number {
  return PRINT_Y_OFFSET_PX[productType ?? '']?.[side] ?? 0
}
