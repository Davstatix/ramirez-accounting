export default function ArrowIcon({ direction = 'up-right' }: { direction?: 'up-right' | 'left' }) {
  return (
    <svg className="arrow-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {direction === 'left' ? <path d="M19 12H5m7-7-7 7 7 7" /> : <path d="M5 19 19 5M5 5h14v14" />}
    </svg>
  )
}
