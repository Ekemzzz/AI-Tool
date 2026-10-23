import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

function SubmitToolCTA() {
  return (
    <section className="submit-tool-cta" aria-labelledby="submit-tool-title">
      <div className="submit-tool-cta__copy">
        <h2 id="submit-tool-title">Know a tool to add?</h2>
        <p>Submissions are not open yet. The form will be added in a later phase.</p>
      </div>
      <Link className="button button--secondary" to="/submit">
        Submit a tool <ArrowRight aria-hidden="true" size={17} />
      </Link>
    </section>
  )
}

export default SubmitToolCTA
