import { memo } from 'react'

export const FocusCard = memo(function FocusCard({ children, className = '', label }) {
  return <article className={className} aria-label={label}>{children}</article>
})
