export interface TextLayer {
  id: string
  text: string
  xPct: number
  yPct: number
  fontFamily: string
  fontSizePct: number
  alignY: 'top' | 'middle' | 'bottom'
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
  shadow: 'off' | 'black' | 'white'
  visible: boolean
}

export interface Revision {
  url: string
  label: string
  transparent: boolean
}

export interface BackgroundPreset {
  id: string
  name: string
  src: string
}

export interface SavedCustomBackground {
  id: string
  resultUrl: string
  thumbUrl: string
  label: string
  value: string
}

export interface FontOption {
  value: string
  label: string
  url?: string
}

export interface MockupPlacement {
  xPct: number
  yPct: number
  scale: number
}
