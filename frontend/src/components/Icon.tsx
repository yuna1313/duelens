const paths = {
  book: 'M4 3h13a3 3 0 0 1 3 3v15H5a3 3 0 0 1 0-6h15 M5 3v12 M8 7h8 M8 10h5',
  plus: 'M12 5v14 M5 12h14',
  edit: 'm15 4 5 5 M4 16l12-12a3 3 0 0 1 4 4L8 20l-5 1 1-5',
  close: 'm6 6 12 12 M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 11v6 M12 7h.01',
  calendar: 'M4 5h16v16H4z M8 2v6 M16 2v6 M4 11h16 M8 15h2 M14 15h2',
  chevron: 'm9 5 7 7-7 7',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3z m-4 9 3 3 5-5',
} as const

export function Icon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
