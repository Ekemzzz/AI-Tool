import { Link } from 'react-router'
import SearchBar from './SearchBar.jsx'
import { categories } from '../../data/categories.js'
import { getSearchRoute } from '../../utils/catalog.js'

const suggestions = ['write code', 'web research', 'generate images', 'customer support']
const quickCategories = ['ai-coding', 'ai-writing', 'ai-research', 'ai-data-analysis']
const featuredCategories = quickCategories
  .map((slug) => categories.find((category) => category.slug === slug))
  .filter(Boolean)

function HeroSection() {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero__content">
        <h1 id="home-title">Find AI tools for the work in front of you</h1>
        <p className="home-hero__description">
          Search the sample catalog by task or category, then follow official links to learn more.
        </p>
        <SearchBar inputId="home-tool-search" />
        <div className="search-suggestions" aria-label="Example searches">
          <span className="search-suggestions__label">Try a search:</span>
          {suggestions.map((suggestion) => (
            <Link key={suggestion} to={getSearchRoute(suggestion)}>
              {suggestion}
            </Link>
          ))}
        </div>
      </div>
      <aside className="home-hero__aside" aria-label="Browse a few categories">
        <p className="home-hero__aside-title">Or start with a category</p>
        <ul>
          {featuredCategories.map((category) => (
            <li key={category.id}>
              <Link to={`/categories/${category.slug}`}>{category.name}</Link>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  )
}

export default HeroSection
