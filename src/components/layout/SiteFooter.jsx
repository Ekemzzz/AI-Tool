import { Link } from 'react-router'
import { primaryNavigation, submissionNavigationItem } from '../../config/navigation.js'

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p className="site-footer__description">A directory for discovering AI tools.</p>
        <nav className="site-footer__navigation" aria-label="Footer navigation">
          <ul className="site-footer__list">
            {primaryNavigation.map(({ label, to }) => (
              <li key={to}>
                <Link to={to}>{label}</Link>
              </li>
            ))}
            <li>
              <Link to={submissionNavigationItem.to}>{submissionNavigationItem.label}</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}

export default SiteFooter
