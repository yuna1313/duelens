export const semesters = [
  { value: '1', label: '1학기' },
  { value: 'summer', label: '여름 계절학기' },
  { value: '2', label: '2학기' },
  { value: 'winter', label: '겨울 계절학기' },
] as const
export type Semester = typeof semesters[number]['value']
export const isSemester = (value: unknown): value is Semester => semesters.some(item => item.value === value)
export const isTerm = (value: unknown): value is string => typeof value === 'string' && /^[1-9]\d{3}-(1|summer|2|winter)$/.test(value)

// A regular-term default only. Seasonal terms and the actual school calendar are selected explicitly.
export function currentTerm(now = new Date()): string {
  const seoul = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const year = seoul.getUTCFullYear()
  const month = seoul.getUTCMonth() + 1
  return `${month < 3 ? year - 1 : year}-${month >= 3 && month <= 8 ? '1' : '2'}`
}

export function termLabel(term: string): string {
  if (!isTerm(term)) return '학기 미지정'
  const [year, semester] = term.split('-')
  return `${year}년 ${semesters.find(item => item.value === semester)!.label}`
}

export function termOptions(selected: string, known: string[] = []): string[] {
  const year = Number(selected.split('-')[0])
  const defaults = [year - 1, year, year + 1].filter(value => value >= 1000 && value <= 9999)
    .flatMap(value => semesters.map(semester => `${value}-${semester.value}`))
  return [...new Set([...defaults, selected, ...known].filter(isTerm))].sort((a, b) => {
    const [yearA, semesterA] = a.split('-'), [yearB, semesterB] = b.split('-')
    return Number(yearB) - Number(yearA) || semesters.findIndex(item => item.value === semesterB) - semesters.findIndex(item => item.value === semesterA)
  })
}
