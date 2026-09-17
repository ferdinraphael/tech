import { publicPath } from '../publicUrl'
import { ArrowDownToLine, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PublishedOutputAction as OutputAction } from '../data/site'

interface PublishedOutputActionProps {
  action: OutputAction
  className?: string
}

export function PublishedOutputAction({ action, className }: PublishedOutputActionProps) {
  if (action.kind === 'internal') {
    return (
      <Link className={className} to={publicPath(action.route)}>
        {action.label} <ArrowRight aria-hidden="true" />
      </Link>
    )
  }

  if (action.kind === 'download') {
    return (
      <a className={className} href={action.href} download={action.fileName ?? true}>
        {action.label} <ArrowDownToLine aria-hidden="true" />
      </a>
    )
  }

  return (
    <a className={className} href={action.href} target="_blank" rel="noreferrer">
      {action.label} <ArrowUpRight aria-hidden="true" />
    </a>
  )
}
