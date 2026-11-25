import type { ComponentProps } from 'react'
import { Icon } from './Icon'
import './Select.css'

export function Select(props: Omit<ComponentProps<'select'>, 'multiple' | 'size'>) {
  return <span className="select-control">
    <select {...props} />
    <Icon name="chevron" size={16} />
  </span>
}
