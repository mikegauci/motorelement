import type { BackgroundPreset, FontOption } from './types'

export const SESSION_KEY = 'car-vector-session-v1'
export const PENDING_GENERATION_KEY = 'car-vector-pending-generation-v1'
export const PENDING_BACKGROUND_KEY = 'car-vector-pending-background-v1'
export const DESIGNER_PLACEHOLDER_BLACK_URL = '/placeholders/your-custom-designed-artwork-black.svg'
export const DESIGNER_PLACEHOLDER_WHITE_URL = '/placeholders/your-custom-designed-artwork-white.svg'
export const NO_BACKGROUND_PRESET_URL = '/presets/no-background.svg'

export function isRealBackgroundUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false
  return !url.includes('no-background.svg')
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


const BLANK_MOCKUP_IMAGES: Record<'front' | 'back', Record<string, Record<string, string>>> = {
  front: {
    't-shirt': {
      white: '/images/mockups/t-shirt/front-white-t-shirt.jpg',
      black: '/images/mockups/t-shirt/front-black-t-shirt.jpg',
      grey:  '/images/mockups/t-shirt/front-grey-t-shirt.jpg',
      navy:  '/images/mockups/t-shirt/front-navy-t-shirt.jpg',
    },
    hoodie: {
      white: '/images/mockups/hoodie/front-white-hoodie.png',
      black: '/images/mockups/hoodie/front-black-hoodie.png',
      grey:  '/images/mockups/hoodie/front-grey-hoodie.png',
      navy:  '/images/mockups/hoodie/front-navy-hoodie.png',
    },
  },
  back: {
    't-shirt': {
      white: '/images/mockups/t-shirt/back-white-t-shirt.jpg',
      black: '/images/mockups/t-shirt/back-black-t-shirt.jpg',
      grey:  '/images/mockups/t-shirt/back-grey-t-shirt.jpg',
      navy:  '/images/mockups/t-shirt/back-navy-t-shirt.jpg',
    },
    hoodie: {
      white: '/images/mockups/hoodie/back-white-hoodie.png',
      black: '/images/mockups/hoodie/back-black-hoodie.png',
      grey:  '/images/mockups/hoodie/back-grey-hoodie.png',
      navy:  '/images/mockups/hoodie/back-navy-hoodie.png',
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

function getGarmentColorSlug(colorTitle: string | null | undefined): string | null {
  if (colorTitle == null || !String(colorTitle).trim()) return null
  return colorSlug(String(colorTitle))
}

type CornerLogoPreset =
  | { id: string; label: string; kind: 'single'; src: string }
  | { id: string; label: string; kind: 'paired'; lightSrc: string; darkSrc: string }

export const LOGO_CORNER_PRESETS: CornerLogoPreset[] = [
  { id: 'retro-cursive', label: 'Retro Cursive', kind: 'single', src: '/logo-presets/retro-cursive.png' },
  { id: 'menace', label: 'Menace', kind: 'paired', lightSrc: '/logo-presets/menace-black.png', darkSrc: '/logo-presets/menace.png' },
  { id: 'thunder', label: 'Thunder', kind: 'paired', lightSrc: '/logo-presets/thunder-black.png', darkSrc: '/logo-presets/thunder.png' },
  { id: 'voyager', label: 'Voyager', kind: 'paired', lightSrc: '/logo-presets/voyager-black.png', darkSrc: '/logo-presets/voyager.png' },
  { id: 'winners-circle', label: 'Winners Circle', kind: 'paired', lightSrc: '/logo-presets/winners-circle-black.png', darkSrc: '/logo-presets/winners-circle.png' },
]

function isLightGarmentSlug(slug: string | null): boolean {
  return slug === 'white' || slug === 'grey'
}

export function resolveDesignerPlaceholderUrl(colorTitle: string | null | undefined): string {
  const slug = getGarmentColorSlug(colorTitle)
  return isLightGarmentSlug(slug)
    ? DESIGNER_PLACEHOLDER_BLACK_URL
    : DESIGNER_PLACEHOLDER_WHITE_URL
}

export function resolveCornerLogoPresetSrc(presetId: string, colorTitle: string | null | undefined): string {
  const preset = LOGO_CORNER_PRESETS.find((p) => p.id === presetId)
  if (!preset) return ''
  if (preset.kind === 'single') return preset.src
  const slug = getGarmentColorSlug(colorTitle)
  return isLightGarmentSlug(slug) ? preset.lightSrc : preset.darkSrc
}

/**
 * Look up a blank mockup image for a given product type, Printify colour title,
 * and side ('front' or 'back'). Returns the image path if a matching file exists,
 * or `null` (caller falls back to the Printify image).
 */
export function getBlankMockupImage(
  productType?: string,
  colorTitle?: string,
  side: 'front' | 'back' = 'front',
): string | null {
  const sideMap = BLANK_MOCKUP_IMAGES[side]
  if (!sideMap) return null
  const typeMap = sideMap[productType ?? '']
  if (!typeMap) return null
  if (colorTitle == null || !String(colorTitle).trim()) return Object.values(typeMap)[0] ?? null
  const slug = getGarmentColorSlug(colorTitle)
  if (!slug) return Object.values(typeMap)[0] ?? null
  return typeMap[slug] ?? null
}

export interface ProductProfile {
  mockupZone: Record<'front' | 'back', {
    xPct: number
    yPct: number
    widthPct: number
  }>
  printArea: Record<'front' | 'back', { width: number; height: number }>
  printExportMultiplier: Record<'front' | 'back', number>
}

const PRODUCT_PROFILES: Record<string, ProductProfile> = {
  't-shirt': {
    mockupZone: {
      front: { xPct: 0.35, yPct: 0.29, widthPct: 0.30 },
      back:  { xPct: 0.35, yPct: 0.25, widthPct: 0.30 },
    },
    printArea: {
      front: { width: 3951, height: 4919 },
      back:  { width: 3951, height: 4919 },
    },
    printExportMultiplier: { front: 1, back: 1 },
  },
  hoodie: {
    mockupZone: {
      front: { xPct: 0.37, yPct: 0.33, widthPct: 0.24 },
      back:  { xPct: 0.39, yPct: 0.30, widthPct: 0.25 },
    },
    printArea: {
      front: { width: 2609, height: 2872 },
      back:  { width: 4200, height: 4800 },
    },
    printExportMultiplier: { front: 0.63, back: 1 },
  },
}

const DEFAULT_PRODUCT_PROFILE = PRODUCT_PROFILES['t-shirt']

export function getProductProfile(productType?: string): ProductProfile {
  return PRODUCT_PROFILES[productType ?? ''] ?? DEFAULT_PRODUCT_PROFILE
}

export type PrintExportMultiplierOverrides = Partial<
  Record<'front' | 'back', number>
>

export function getPrintExportMultiplier(
  productType: string | undefined,
  side: 'front' | 'back',
  overrides?: PrintExportMultiplierOverrides | null,
): number {
  const base = getProductProfile(productType).printExportMultiplier[side]
  const o = overrides?.[side]
  if (o != null && Number.isFinite(o) && o > 0) return o
  return base
}

export function getMockupPrintZone(productType?: string, side: 'front' | 'back' = 'front') {
  const profile = getProductProfile(productType)
  const z = profile.mockupZone[side]
  const pa = profile.printArea[side]
  const printAspect = pa.width / pa.height
  return {
    xPct: z.xPct,
    yPct: z.yPct,
    widthPct: z.widthPct,
    heightPct: z.widthPct / printAspect,
  }
}
