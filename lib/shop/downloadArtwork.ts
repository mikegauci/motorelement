export const DOWNLOAD_ARTWORK_PRICE_CENTS = 999
export const DOWNLOAD_ARTWORK_LABEL = 'Digital Artwork Download'

export function formatDownloadArtworkPrice() {
  return `$${(DOWNLOAD_ARTWORK_PRICE_CENTS / 100).toFixed(2)}`
}

export function downloadArtworkFeeCents(
  items: { downloadArtwork?: boolean }[]
): number {
  return (
    items.filter((item) => item.downloadArtwork).length *
    DOWNLOAD_ARTWORK_PRICE_CENTS
  )
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

export async function triggerBrowserDownload(url: string, filename: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status})`)
  const blob = await res.blob()
  triggerBlobDownload(blob, filename)
}
