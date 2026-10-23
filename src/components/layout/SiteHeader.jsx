import { useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
import MobileNavigation from '../common/MobileNavigation.jsx'
import { primaryNavigation, submissionNavigationItem } from '../../config/navigation.js'

function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const closeMenuAndReturnFocus = () => {
    setIsMenuOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="site-brand" to="/" aria-label="AI Tools Directory home">
          AI Tools Directory
        </Link>

        <nav className="desktop-navigation" aria-label="Primary navigation">
          <ul className="site-navigation-list">
            {primaryNavigation.map(({ label, to }) => (
              <li key={to}>
                <NavLink
                  className={({ isActive }) =>
                    `site-navigation-link${isActive ? ' is-active' : ''}`
                  }
                  to={to}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <NavLink className="button button--primary header-submit" to={submissionNavigationItem.to}>
            {submissionNavigationItem.label}
          </NavLink>
        </nav>

        <MobileNavigation
          isOpen={isMenuOpen}
          onClose={closeMenuAndReturnFocus}
          onToggle={() => setIsMenuOpen((open) => !open)}
          triggerRef={menuButtonRef}
        />
      </div>
    </header>
  )
}

export default SiteHeader
