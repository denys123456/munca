export function focusGeometry(rect, viewportWidth, viewportHeight) {
  const margin = 24
  if (rect.width <= 0 || rect.height <= 0) return null
  const scale = Math.min(1.65, (viewportWidth - margin * 2) / rect.width, (viewportHeight - margin * 2) / rect.height)
  if (scale < 1.1) return null
  const left = Math.max(margin, Math.min(rect.left - rect.width * (scale - 1) / 2, viewportWidth - rect.width * scale - margin))
  const top = Math.max(margin, Math.min(rect.top - rect.height * (scale - 1) / 2, viewportHeight - rect.height * scale - margin))
  return { left, top, width: rect.width, height: rect.height, scale, originX: rect.left - left, originY: rect.top - top }
}
