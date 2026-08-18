import {
  ArrowUpRight,
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
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { links } from '../data/site'
import styles from './Tech.module.css'

const primaryNav = [
  { label: 'Overview', to: '/' },
  { label: 'Profile', to: '/profile' },
  { label: 'Projects', to: '/projects' },
  { label: 'Services', to: '/services' },
  { label: 'Writings', to: '/writings' },
]

const bottomNav = [
  { label: 'Overview', to: '/', icon: Home },
  { label: 'Projects', to: '/projects', icon: Package },
  { label: 'Services', to: '/services', icon: PanelsTopLeft },
  { label: 'Writings', to: '/writings', icon: FileText },
]

function Brand() {
  return (
    <NavLink to="/" className={styles.brand} aria-label="Ferdin Raphael technical overview">
      <Code2 aria-hidden="true" />
      <span className={styles.brandName}>Ferdin Raphael</span>
      <span className={styles.brandRule} aria-hidden="true" />
      <span className={styles.brandDescriptor}>Software &amp; Systems</span>
    </NavLink>
  )
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    closeButtonRef.current?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [menuOpen])

  return (
    <div className={styles.siteFrame}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <header className={styles.siteHeader}>
        <Brand />
        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? styles.navActive : undefined)}
            >
              {item.label}
            </NavLink>
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
        <div className={styles.menuBackdrop} onMouseDown={() => setMenuOpen(false)}>
          <nav
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
                onClick={() => {
                  setMenuOpen(false)
                  menuButtonRef.current?.focus()
                }}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            {primaryNav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
            <div className={styles.mobileMenuExternal}>
              <a href={links.identity} target="_blank" rel="noreferrer">
                Existing identity site <ArrowUpRight aria-hidden="true" />
              </a>
              <a href={links.github} target="_blank" rel="noreferrer">
                GitHub <ArrowUpRight aria-hidden="true" />
              </a>
              <a href={links.email}>Email</a>
            </div>
          </nav>
        </div>
      )}

      <main id="main-content">
        <Outlet />
      </main>

      <footer className={styles.siteFooter}>
        <span>© 2026 Ferdin Raphael</span>
        <div className={styles.footerLinks}>
          <a href={links.identity} target="_blank" rel="noreferrer">
            <Home aria-hidden="true" /> Identity Hub
          </a>
          <a href={links.github} target="_blank" rel="noreferrer">
            <Github aria-hidden="true" /> GitHub
          </a>
          <NavLink to="/writings">
            <FileText aria-hidden="true" /> Writings
          </NavLink>
          <a href={links.email}>
            <Mail aria-hidden="true" /> Contact
          </a>
        </div>
        <span className={styles.footerStatus}>
          <i aria-hidden="true" /> Building systems. Running experiments. Preparing writings.
        </span>
      </footer>

      <nav className={styles.bottomNav} aria-label="Mobile primary navigation">
        {bottomNav.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => (isActive ? styles.bottomNavActive : undefined)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
