import './Brand.css'

export function Brand({ href = '#/tasks' }: { href?: string }) {
  return (
    <a href={href} className="brand">
      <span className="brand-mark">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 5h7a7 7 0 0 1 0 14H5V5Z" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="11.5" cy="12" r="2.5" fill="currentColor" />
        </svg>
      </span>DueLens
    </a>
  )
}
