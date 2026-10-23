import { Outlet, useLocation } from 'react-router'
import CatalogStatus from '../common/CatalogStatus.jsx'
import CompareTray from '../compare/CompareTray.jsx'
import ErrorBoundary from '../common/ErrorBoundary.jsx'
import SiteFooter from './SiteFooter.jsx'
import SiteHeader from './SiteHeader.jsx'
import '../../styles/layout.css'

function AppShell() {
  const { pathname } = useLocation()
  const isHomePage = pathname === '/'

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="app-shell">
        <SiteHeader />
        <main id="main-content" className={`site-main${isHomePage ? ' site-main--home' : ''}`} tabIndex={-1}>
          <div className="container site-main__container">
            <CatalogStatus />
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
        <CompareTray />
        <SiteFooter />
      </div>
    </>
  )
}

export default AppShell
