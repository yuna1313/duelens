import { createContext } from 'react'

export interface AcademicTermPreferences {
  selectedTerm: string
  enabled: boolean
  selectTerm: (term: string) => boolean
}
export const AcademicTermContext = createContext<AcademicTermPreferences | null>(null)
