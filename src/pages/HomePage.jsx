import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { useRef } from 'react'
import FeaturedTools from '../components/home/FeaturedTools.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import MoreTools from '../components/home/MoreTools.jsx'
import SectionHeading from '../components/home/SectionHeading.jsx'
import SubmitToolCTA from '../components/home/SubmitToolCTA.jsx'
import CategoryGrid from '../components/home/CategoryGrid.jsx'
import useScrollReveal from '../hooks/useScrollReveal.js'
import usePageMeta from '../hooks/usePageMeta.js'
import useCatalog from '../hooks/useCatalog.js'
import '../styles/home.css'

function HomePage() {
  const pageRef = useRef(null)
  const { tools, categories, loading } = useCatalog()
  useScrollReveal(pageRef)
  usePageMeta()

  return (
    <div className="home-page" ref={pageRef}>
      <HeroSection />

      {loading && tools.length === 0 ? (
        <p className="catalog-loading" role="status">Loading the catalog…</p>
      ) : (
        <>
      <section className="home-section category-section" aria-labelledby="category-title">
        <SectionHeading
          id="category-title"
          title="Browse by category"
          description="Choose a kind of work to see related tools in the sample catalog."
        />
        <CategoryGrid categories={categories} tools={tools} />
      </section>

      <FeaturedTools tools={tools} />
      <MoreTools tools={tools} />
      <HowItWorks />
      <SubmitToolCTA />

      <section className="home-final-cta" aria-labelledby="final-cta-title">
        <h2 id="final-cta-title">Ready to explore?</h2>
        <Link className="button button--primary" to="/tools">
          Browse all tools <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </section>
        </>
      )}
    </div>
  )
}

export default HomePage
