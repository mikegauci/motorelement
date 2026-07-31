export const DESIGNER_SOURCE_FILES_PRICE_CENTS = 999
export const DESIGNER_SOURCE_FILES_LABEL = 'Include Source Files'

export const DESIGNER_PRIORITY_PRICE_CENTS = 500
export const DESIGNER_PRIORITY_LABEL = 'Priority Rush'

export function formatDesignerSourceFilesPrice() {
  return `$${(DESIGNER_SOURCE_FILES_PRICE_CENTS / 100).toFixed(2)}`
}

export function formatDesignerPriorityPrice() {
  return `$${(DESIGNER_PRIORITY_PRICE_CENTS / 100).toFixed(2)}`
}

export function designerSourceFilesFeeCents(
  items: { includeSourceFiles?: boolean; quantity?: number }[]
): number {
  return items.reduce((sum, item) => {
    if (!item.includeSourceFiles) return sum
    return sum + DESIGNER_SOURCE_FILES_PRICE_CENTS * Math.max(1, item.quantity ?? 1)
  }, 0)
}

export function designerPriorityFeeCents(
  items: { designerPriority?: boolean; quantity?: number }[]
): number {
  return items.reduce((sum, item) => {
    if (!item.designerPriority) return sum
    return sum + DESIGNER_PRIORITY_PRICE_CENTS * Math.max(1, item.quantity ?? 1)
  }, 0)
}

export function designerAddonsFeeCents(
  items: { includeSourceFiles?: boolean; designerPriority?: boolean; quantity?: number }[]
): number {
  return designerSourceFilesFeeCents(items) + designerPriorityFeeCents(items)
}

export function designerSourceFilesUnits(
  items: { includeSourceFiles?: boolean; quantity?: number }[]
): number {
  return items.reduce((sum, item) => {
    if (!item.includeSourceFiles) return sum
    return sum + Math.max(1, item.quantity ?? 1)
  }, 0)
}

export function designerPriorityUnits(
  items: { designerPriority?: boolean; quantity?: number }[]
): number {
  return items.reduce((sum, item) => {
    if (!item.designerPriority) return sum
    return sum + Math.max(1, item.quantity ?? 1)
  }, 0)
}
