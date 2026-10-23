import { Link } from 'react-router'
import SectionHeading from './SectionHeading.jsx'

function HowItWorks() {
  return (
    <section className="home-section how-it-works" aria-labelledby="how-it-works-title">
      <SectionHeading id="how-it-works-title" title="How the directory works" />
      <div className="how-it-works__copy reading-width">
        <p>
          Search for a task or browse a category to see a small, locally stored sample of AI tools.
          Review each product summary and its official links, then visit the provider for current
          details and pricing.
        </p>
        <p>
          <Link to="/tools">Explore the sample catalog</Link> or{' '}
          <Link to="/categories">browse all categories</Link>.
        </p>
      </div>
    </section>
  )
}

export default HowItWorks
