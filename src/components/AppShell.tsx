import { publicPath } from '../publicUrl'
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  FileText,
  Github,
  Home,
  Mail,
  Menu,
  Package,
  PanelsTopLeft,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useMatch, type LinkProps } from 'react-router-dom'
import { links } from '../data/site'
import { trackSiteLink } from '../analytics'
import styles from './Tech.module.css'

const primaryNav = [
  { label: 'Overview', to: '/' },
  { label: 'Projects', to: '/projects' },
  { label: 'Built & Published', to: '/built-and-published' },
  { label: 'Services', to: '/services' },
  { label: 'Writings', to: '/writings' },
]

const bottomNav = [
  { label: 'Overview', to: '/', icon: Home },
  { label: 'Projects', to: '/projects', icon: Package },
  { label: 'Built & Published', to: '/built-and-published', icon: BookOpen },
  { label: 'Services', to: '/services', icon: PanelsTopLeft },
  { label: 'Writings', to: '/writings', icon: FileText },
]

function NavigationLink({ to, className, ...props }: Omit<LinkProps, 'to' | 'className'> & {
  to: string
  className?: string | ((state: { isActive: boolean }) => string | undefined)
}) {
  const isActive = useMatch({ path: to, end: to === '/' }) !== null
  return <Link {...props} to={publicPath(to)} aria-current={isActive ? 'page' : undefined}
    className={typeof className === 'function' ? className({ isActive }) : className ?? (isActive ? 'active' : undefined)} />
}

function Brand() {
  return (
    <NavigationLink to="/" className={styles.brand} aria-label="Ferdin Raphael technical overview">
      <Code2 aria-hidden="true" />
      <span className={styles.brandName}>Ferdin Raphael</span>
      <span className={styles.brandRule} aria-hidden="true" />
      <span className={styles.brandDescriptor}>Software &amp; Systems</span>
    </NavigationLink>
  )
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const trigger = menuButtonRef.current
    closeButtonRef.current?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setMenuOpen(false)
      }
      if (event.key === 'Tab') {
        const controls = menuRef.current?.querySelectorAll<HTMLElement>('button, a[href]')
        const first = controls?.[0]
        const last = controls?.[controls.length - 1]
        const outside = !menuRef.current?.contains(document.activeElement)
        if (event.shiftKey && (document.activeElement === first || outside)) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && (document.activeElement === last || outside)) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('keydown', close)
      // Restore after React removes inert from the background, including the trigger.
      trigger?.focus()
    }
  }, [menuOpen])

  return (
    <div className={styles.siteFrame} onClickCapture={(event) => {
      const anchor = event.target instanceof Element ? event.target.closest('a') : null
      if (anchor) trackSiteLink(anchor.getAttribute('href') ?? '', location.pathname)
    }}>
      <a className={styles.skipLink} href="#main-content" inert={menuOpen}>
        Skip to content
      </a>
      <header className={styles.siteHeader} inert={menuOpen}>
        <Brand />
        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <NavigationLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? styles.navActive : undefined)}
            >
              {item.label}
            </NavigationLink>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <a href={links.github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
            <Github aria-hidden="true" />
          </a>
          <a href={links.email} aria-label="Email Ferdin Raphael">
            <Mail aria-hidden="true" />
          </a>
        </div>
        <button
          ref={menuButtonRef}
          className={styles.menuButton}
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu aria-hidden="true" />
        </button>
      </header>

      {menuOpen && (
        <div
          className={styles.menuBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onMouseDown={(event) => {
            // Default mouse-down focus must not override restored trigger focus.
            event.preventDefault()
            closeMenu()
          }}
        >
          <nav
            ref={menuRef}
            id="mobile-menu"
            className={styles.mobileMenu}
            aria-label="Mobile navigation"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.mobileMenuTop}>
              <span>Navigate</span>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close navigation menu"
                onClick={closeMenu}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            {primaryNav.map((item) => (
              <NavigationLink key={item.to} to={item.to} onClick={closeMenu}>
                {item.label}
              </NavigationLink>
            ))}
            <div className={styles.mobileMenuExternal}>
              <a href={links.github} target="_blank" rel="noreferrer" onClick={closeMenu}>
                GitHub <ArrowUpRight aria-hidden="true" />
              </a>
              <a href={links.email} onClick={closeMenu}>Email</a>
            </div>
          </nav>
        </div>
      )}

      <main id="main-content" inert={menuOpen}>
        <Outlet />
      </main>

      <footer className={styles.siteFooter} inert={menuOpen}>
        <span>© 2026 Ferdin Raphael</span>
        <div className={styles.footerLinks}>
          <a href={links.identity} target="_blank" rel="noreferrer">
            <Home aria-hidden="true" /> Identity Hub
          </a>
          <a href={links.github} target="_blank" rel="noreferrer">
            <Github aria-hidden="true" /> GitHub
          </a>
          <NavigationLink to="/writings">
            <FileText aria-hidden="true" /> Writings
          </NavigationLink>
          <a href={links.email}>
            <Mail aria-hidden="true" /> Contact
          </a>
        </div>
        <span className={styles.footerStatus}>
          <i aria-hidden="true" /> Software · Systems · Experiments · Writing
        </span>
      </footer>

      <nav className={styles.bottomNav} aria-label="Mobile primary navigation" inert={menuOpen}>
        {bottomNav.map(({ label, to, icon: Icon }) => (
          <NavigationLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? styles.bottomNavActive : undefined)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavigationLink>
        ))}
      </nav>
    </div>
  )
}
