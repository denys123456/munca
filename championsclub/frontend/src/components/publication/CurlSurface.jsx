import { forwardRef, useId } from 'react'

export const CurlSurface = forwardRef(function CurlSurface(_, ref) {
  const id = useId().replaceAll(':', '')
  return <svg ref={ref} className="curl-surface" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-paper`} data-fold-gradient gradientUnits="userSpaceOnUse"><stop stopColor="#f4f1e9" /><stop offset=".6" stopColor="#ede9de" /><stop offset=".88" stopColor="#ddd7c7" /><stop offset="1" stopColor="#fffdf7" /></linearGradient>
      <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="8" /></filter>
    </defs>
    <path data-fold-shadow fill="#5e5749" filter={`url(#${id}-shadow)`} />
    <path data-fold-face fill={`url(#${id}-paper)`} stroke="#c7c0ae" strokeWidth=".5" />
    <path data-fold-crease fill="none" stroke="#b6ac9438" />
    <path data-fold-light fill="none" stroke="#fffef9" strokeWidth="1.2" />
  </svg>
})
