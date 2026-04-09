import { readdir } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2'])

function toTitleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function collectFontFiles(dirPath: string, rootPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const nextPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      const nested = await collectFontFiles(nextPath, rootPath)
      files.push(...nested)
      continue
    }
    const ext = path.extname(entry.name).toLowerCase()
    if (!FONT_EXTENSIONS.has(ext)) continue
    const relativePath = path.relative(rootPath, nextPath).split(path.sep).join('/')
    files.push(relativePath)
  }
  return files
}

export async function GET() {
  try {
    const fontsRoot = path.join(process.cwd(), 'public', 'fonts')
    const fontFiles = await collectFontFiles(fontsRoot, fontsRoot)
    const usedFamilies = new Set<string>()
    const fonts = fontFiles.map((relativePath) => {
      const baseName = path.basename(relativePath, path.extname(relativePath))
      const prettyName = toTitleCase(baseName.replace(/[-_]+/g, ' ').trim() || 'Custom Font')
      let family = `custom_font_${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'font'}`
      let suffix = 2
      while (usedFamilies.has(family)) {
        family = `${family}_${suffix++}`
      }
      usedFamilies.add(family)
      return {
        value: family,
        label: prettyName,
        url: `/fonts/${relativePath}`,
      }
    })
    return Response.json({ fonts })
  } catch {
    return Response.json({ fonts: [] })
  }
}
