import './Toggle.css'

export function Toggle({ checked, labelledBy, disabled = false, onChange }: { checked: boolean; labelledBy: string; disabled?: boolean; onChange?: (value: boolean) => void }) {
  return <button type="button" className="toggle" role="switch" aria-checked={checked} aria-labelledby={labelledBy} disabled={disabled} onClick={() => onChange?.(!checked)}><span /></button>
}
