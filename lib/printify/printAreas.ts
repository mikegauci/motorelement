export type PrintAreaImage = {
  src: string
  x: number
  y: number
  scale: number
  angle: number
}

export type PrintAreas = Record<string, string | PrintAreaImage[]>

type Placement = Pick<PrintAreaImage, 'x' | 'y' | 'scale' | 'angle'>

const MUG_FRONT_PLACEMENT: Placement = {
  x: 0.80,
  y: 0.5,
  scale: 1,
  angle: 0,
}

const MUG_BLACK_FRONT_PLACEMENT: Placement = {
  x: 0.74,
  y: 0.48,
  scale: 1,
  angle: 0,
}

function positioned(src: string, placement: Placement): PrintAreaImage[] {
  return [{ src, ...placement }]
}

function isBlackColor(color?: string | null): boolean {
  return color?.toLowerCase().replace(/\s+/g, '-').trim() === 'black'
}

function mugFrontPlacement(color?: string | null): Placement {
  return isBlackColor(color) ? MUG_BLACK_FRONT_PLACEMENT : MUG_FRONT_PLACEMENT
}

export function buildPrintAreas({
  productType,
  artworkUrl,
  artworkSide = 'front',
  textArtworkUrl,
  textArtworkSide,
  color,
}: {
  productType?: string | null
  artworkUrl: string
  artworkSide?: 'front' | 'back'
  textArtworkUrl?: string | null
  textArtworkSide?: 'front' | 'back' | null
  color?: string | null
}): PrintAreas {
  if (productType === 'mug') {
    const printAreas: PrintAreas = {
      front: positioned(artworkUrl, mugFrontPlacement(color)),
    }
    if (textArtworkUrl && textArtworkSide && textArtworkSide !== 'front') {
      printAreas[textArtworkSide] = positioned(textArtworkUrl, {
        x: 0.5,
        y: 0.5,
        scale: 1,
        angle: 0,
      })
    }
    return printAreas
  }

  const printAreas: PrintAreas = { [artworkSide]: artworkUrl }
  if (textArtworkUrl && textArtworkSide) {
    printAreas[textArtworkSide] = textArtworkUrl
  }
  return printAreas
}
