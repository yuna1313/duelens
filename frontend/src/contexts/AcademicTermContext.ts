import { createContext } from 'react'

export interface AcademicTermPreferences {
  selectedTerm: string | null
  enabled: boolean
  selectTerm: (term: string) => boolean
  preview: boolean
  exitPreview: () => void
}
export const AcademicTermContext = createContext<AcademicTermPreferences | null>(null)
