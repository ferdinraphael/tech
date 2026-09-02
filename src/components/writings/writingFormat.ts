export function formatWritingDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

export function publishedWritingPresentation(count: number) {
  const single = count === 1
  return {
    heading: `Latest writing${single ? '' : 's'}`,
    layout: single ? 'single' : 'grid',
    showCount: count > 1,
  } as const
}
