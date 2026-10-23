import { useState } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import usePageMeta from '../hooks/usePageMeta.js'
import { joinWaitlist } from '../lib/queries.js'
import '../styles/submit.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SubmitPage() {
  usePageMeta({
    title: 'Submit a tool',
    description: 'Tool submissions are opening soon. Leave your email to be notified when the submission form goes live.',
  })
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setError('Please enter a valid email address.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const { status } = await joinWaitlist(value)
      if (status === 'ok' || status === 'duplicate' || status === 'local') {
        // Already on the list (or no backend configured) still confirms.
        setSubmitted(true)
      } else if (status === 'rate_limited') {
        setError("That's a little quick — please wait a minute and try again.")
      } else {
        setError('Please enter a valid email address.')
      }
    } catch (submitError) {
      console.warn('Waitlist signup failed:', submitError.message)
      setError('Something went wrong saving your email. Please try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="submit-page reading-width" aria-labelledby="submit-title">
      <Link className="back-link" to="/">
        <ArrowLeft aria-hidden="true" size={16} /> Back to home
      </Link>

      <h1 id="submit-title">Submit a tool</h1>
      <p>
        Tool submissions are not open yet — the review and listing flow is planned for an upcoming
        phase. Leave your email below and we'll notify you the moment the submission form goes live.
      </p>

      {submitted ? (
        <div className="submit-page__confirmation" role="status">
          <CheckCircle2 aria-hidden="true" size={20} />
          <p>
            Thanks — <strong>{email.trim()}</strong> is on the notify list. We'll reach out when
            submissions open. In the meantime, feel free to browse the catalog.
          </p>
          <Link className="button button--primary" to="/tools">Explore tools</Link>
        </div>
      ) : (
        <form className="submit-page__form" onSubmit={handleSubmit} noValidate>
          <label className="submit-page__label" htmlFor="notify-email">
            Email address
          </label>
          <div className="submit-page__controls">
            <input
              id="notify-email"
              className="submit-page__input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => { setEmail(event.target.value); if (error) setError('') }}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'notify-email-error' : undefined}
              disabled={submitting}
            />
            <button className="button button--primary" type="submit" disabled={submitting || !email.trim()}>
              {submitting ? 'Adding…' : 'Notify me'}
            </button>
          </div>
          {error && (
            <p className="submit-page__error" id="notify-email-error" role="alert">
              {error}
            </p>
          )}
          <p className="submit-page__hint">
            This is a waitlist only — no account is created and we never share your address.
          </p>
        </form>
      )}
    </section>
  )
}

export default SubmitPage
