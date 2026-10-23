import { Route, Routes } from 'react-router'
import AppShell from './components/layout/AppShell.jsx'
import HomePage from './pages/HomePage.jsx'
import ExplorePage from './pages/ExplorePage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import ToolDetailPage from './pages/ToolDetailPage.jsx'
import SavedPage from './pages/SavedPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import SubmitPage from './pages/SubmitPage.jsx'
import AboutPage from './pages/AboutPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/tools" element={<ExplorePage />} />
        <Route path="/tools/:slug" element={<ToolDetailPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route
          path="/about"
          element={<AboutPage />}
        />
        <Route
          path="/submit"
          element={<SubmitPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
