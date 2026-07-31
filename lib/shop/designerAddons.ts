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
  items: { includeSourceFiles?: boolean }[]
): number {
  return (
    items.filter((item) => item.includeSourceFiles).length *
    DESIGNER_SOURCE_FILES_PRICE_CENTS
  )
}

export function designerPriorityFeeCents(
  items: { designerPriority?: boolean }[]
): number {
  return (
    items.filter((item) => item.designerPriority).length *
    DESIGNER_PRIORITY_PRICE_CENTS
  )
}

export function designerAddonsFeeCents(
  items: { includeSourceFiles?: boolean; designerPriority?: boolean }[]
): number {
  return designerSourceFilesFeeCents(items) + designerPriorityFeeCents(items)
}
