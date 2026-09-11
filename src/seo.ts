export const siteUrl = 'https://ferdinraphael.github.io/tech/'

export interface PageMetadata {
  title?: string
  description: string
  // Null means a hidden, draft, or unavailable page: no canonical and noindex.
  path: string | null
}

export const pageMetadata = {
  overview: { path: '/', description: 'Software, systems, projects, services, writings, and technical experiments by Ferdin Raphael.' },
  projects: { path: '/projects', title: 'Projects', description: 'Public software projects including Little Worlds and Wildpath.' },
  'built-and-published': { path: '/built-and-published', title: 'Built & Published', description: 'Technical books, tools, and small standalone software releases by Ferdin Raphael.' },
  services: { path: '/services', title: 'Services', description: 'Remote software development, technical consulting, and mentoring services.' },
  'software-development': { path: '/services/software-development', title: 'Software Development', description: 'Remote software development for focused builds, product work, integrations, and part-time development support.' },
  'technical-consulting': { path: '/services/technical-consulting', title: 'Technical Consulting', description: 'Remote technical consulting for architecture reviews, modernization planning, cloud and AI decisions, and ongoing technical advice.' },
  'mentoring-teaching': { path: '/services/mentoring-teaching', title: 'Mentoring & Teaching', description: 'Remote 1-on-1 technical learning, developer mentoring, and small-group training.' },
  writings: { path: '/writings', title: 'Writings', description: 'Technical writing about software, systems, implementation decisions, and lessons from building and debugging.' },
  profile: { path: null, title: 'Profile', description: 'Technical background and experience of Ferdin Raphael.' },
  notFound: { path: null, title: 'Not Found', description: 'The requested page is not available.' },
} satisfies Record<string, PageMetadata>
