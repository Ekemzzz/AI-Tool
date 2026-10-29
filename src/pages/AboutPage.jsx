import { ArrowRight, BookmarkCheck, CircleDollarSign, ExternalLink, ListFilter, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import useCatalog from '../hooks/useCatalog.js'
import useCountUp from '../hooks/useCountUp.js'
import '../styles/about.css'

function AboutPage() {
  // Each mount gets a new trigger value so the counter replays on every page visit.
  const [trigger] = useState(() => Date.now())
  const { tools, categories } = useCatalog()

  const toolCount = useCountUp(tools.length, 1200, trigger)
  const categoryCount = useCountUp(categories.length, 1000, trigger)

  return (
    <div className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero__content">
          <h1 id="about-title">About this directory</h1>
          <p className="about-hero__description">
            Finding an AI tool should start with what you want to do, not a list of buzzwords.
            This directory brings a growing selection of tools together so you can search by task,
            explore by category, and decide what is worth a closer look.
          </p>
          <div className="about-hero__actions">
            <Link className="button button--primary" to="/tools">
              Explore the directory <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <Link className="text-link" to="/categories">Browse categories</Link>
          </div>
        </div>
        <aside className="about-snapshot" aria-label="Directory at a glance">
          <p className="about-snapshot__label">The catalog today</p>
          <div className="about-snapshot__stats">
            <div><strong>{toolCount}</strong><span>sample listings</span></div>
            <div><strong>{categoryCount}</strong><span>categories</span></div>
          </div>
          <p className="about-snapshot__note">
            A curated starting catalog that will grow as more tools are reviewed and added.
          </p>
        </aside>
      </section>

      <section className="about-section" aria-labelledby="about-purpose-title">
        <div className="about-section__heading">
          <p className="about-eyebrow">Not sure where to start?</p>
          <h2 id="about-purpose-title">Find an AI tool for the work you actually do</h2>
          <p>Whether you’re writing an email, researching a topic, coding an app, designing something new, or trying to save time on repetitive tasks, start with what you need to get done.</p>
        </div>
        <div className="about-feature-grid">
          <article className="about-feature-card">
            <Search aria-hidden="true" size={22} />
            <h3>Search by task</h3>
            <p>Look for a product or a job to be done, such as drafting, research, coding, or creating images.</p>
          </article>
          <article className="about-feature-card">
            <ListFilter aria-hidden="true" size={22} />
            <h3>Explore by category</h3>
            <p>Browse related tools across areas like productivity, education, audio, design, and development.</p>
          </article>
          <article className="about-feature-card">
            <BookmarkCheck aria-hidden="true" size={22} />
            <h3>Save for later</h3>
            <p>Keep interesting listings in Saved tools while you compare options and plan what to try next.</p>
          </article>
        </div>
      </section>

      <section className="about-details" aria-label="About the catalog">
        <article className="about-detail-card">
          <div className="about-detail-card__icon"><ExternalLink aria-hidden="true" size={20} /></div>
          <div>
            <h2>Clear listings, useful links</h2>
            <p>
              Each listing gives a short description and may include categories, use cases, and product notes.
              Follow the official website and source links to check the provider’s current features and terms.
            </p>
          </div>
        </article>
        <article className="about-detail-card">
          <div className="about-detail-card__icon"><CircleDollarSign aria-hidden="true" size={20} /></div>
          <div>
            <h2>Pricing is a guide, not a guarantee</h2>
            <p>
              Pricing labels are a quick indication, not a quote. Plans and features change often, so confirm
              the latest price and availability directly with the provider before making a decision.
            </p>
          </div>
        </article>
      </section>

      <section className="about-growth" aria-labelledby="about-growth-title">
        <div>
          <p className="about-eyebrow">Found a tool you love?</p>
          <h2 id="about-growth-title">Let’s make it easier for others to find.</h2>
          <p>
            If an AI tool has made your work easier, it could help someone else too. Submissions aren’t open yet,
            but you can check the Submit a tool page for updates.
          </p>
        </div>
        <Link className="button button--secondary" to="/submit">
          About submissions <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </section>
    </div>
  )
}

export default AboutPage
