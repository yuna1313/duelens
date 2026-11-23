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
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  search: 'M20 20l-5-5 M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14',
  arrow: 'M4 12h16 m-6-6 6 6-6 6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',
  inbox: 'M4 4h16l2 12v4H2v-4L4 4z M2 15h6l2 3h4l2-3h6',
  file: 'M14 2H4v20h16V8l-6-6z M14 2v6h6 M8 13h8 M8 17h5',
  refresh: 'M20 7a8 8 0 1 0 0 10 M20 2v5h-5',
  back: 'M20 12H4 m6-6-6 6 6 6',
  external: 'M14 3h7v7 M21 3l-9 9 M10 3H4v17h16v-6',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 10h18c0-3-3-3-3-10 M10 22h4 M12 2v-1',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
} as const

export function Icon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
