import { useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink } from 'react-router'
import { primaryNavigation, submissionNavigationItem } from '../../config/navigation.js'

function MobileNavigation({ isOpen, onClose, onToggle, triggerRef }) {
  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const navigationItems = [...primaryNavigation, submissionNavigationItem]

  return (
    <div className="mobile-navigation-wrap">
      <button
        ref={triggerRef}
        className="mobile-menu-toggle"
        type="button"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={onToggle}
      >
        {isOpen ? (
          <X aria-hidden="true" color="currentColor" size={22} strokeWidth={1.8} />
        ) : (
          <Menu aria-hidden="true" color="currentColor" size={22} strokeWidth={1.8} />
        )}
      </button>

      <nav
        id="mobile-navigation"
        className="mobile-navigation"
        aria-label="Mobile navigation"
        hidden={!isOpen}
      >
        <ul className="mobile-navigation-list">
          {navigationItems.map(({ label, to }) => (
            <li key={to}>
              <NavLink
                className={({ isActive }) =>
                  `mobile-navigation-link${isActive ? ' is-active' : ''}${to === submissionNavigationItem.to ? ' mobile-navigation-link--submit' : ''}`
                }
                to={to}
                onClick={onClose}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default MobileNavigation
