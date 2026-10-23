import { useEffect } from 'react'

const STAGGER_MS = 45
const MAX_STAGGER_STEPS = 10
const REVEAL_DURATION_MS = 550
const STRIP_BUFFER_MS = 120

// Reveals home-page sections and [data-reveal] cards as they scroll into view.
// Content stays fully visible when JavaScript is unavailable or the visitor
// prefers reduced motion, because the hiding styles only apply under .reveal-enabled.
function useScrollReveal(containerRef) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    container.classList.add('reveal-enabled')

    const processed = new WeakSet()
    const pendingTargets = new Map()

    const stripReveal = (target) => {
      target.removeAttribute('data-reveal')
      target.classList.remove('is-revealed')
      target.style.removeProperty('--reveal-delay')
    }
    const finalize = (target) => {
      const timer = pendingTargets.get(target)
      if (timer) {
        clearTimeout(timer)
        pendingTargets.delete(target)
      }
      stripReveal(target)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const target = entry.target
          target.classList.add('is-revealed')
          observer.unobserve(target)
          // Once the one-shot reveal animation finishes, drop the reveal attributes
          // so the element falls back to its own styling (hover transitions etc.).
          target.addEventListener('animationend', (event) => {
            if (event.target !== target || event.animationName !== 'reveal-rise') return
            finalize(target)
          })
          // Safety net: if animationend never fires (interrupted/suppressed
          // animation), still strip so no element is left carrying reveal state.
          const delay = parseFloat(target.style.getPropertyValue('--reveal-delay')) || 0
          pendingTargets.set(
            target,
            setTimeout(() => finalize(target), REVEAL_DURATION_MS + delay + STRIP_BUFFER_MS),
          )
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    // Sections get the same data-reveal treatment as cards, so the CSS
    // (scoped to [data-reveal]) reveals them and the animationend cleanup
    // strips them the same way. They skip the stagger delay though — they
    // scroll in one at a time already, so a delay would only make them lag.
    const prepare = (target) => {
      if (processed.has(target)) return
      processed.add(target)
      target.setAttribute('data-reveal', '')
      if (target.parentElement !== container) {
        const parent = target.parentElement
        if (parent) {
          const siblings = Array.from(parent.querySelectorAll(':scope > [data-reveal]'))
          const index = siblings.indexOf(target)
          if (index > 0) {
            target.style.setProperty('--reveal-delay', `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms`)
          }
        }
      }
      observer.observe(target)
    }

    const scan = () => {
      container.querySelectorAll(':scope > section, [data-reveal]').forEach(prepare)
    }
    scan()

    // The catalog loads asynchronously, so cards and sections mount after this
    // effect first runs. Without re-scanning they'd keep the (hardcoded)
    // data-reveal attribute under a .reveal-enabled container — hidden at
    // opacity 0 and never observed, so they'd never appear. Watch the subtree
    // and register any newly added reveal targets.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          scan()
          break
        }
      }
    })
    mutationObserver.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
      pendingTargets.forEach((timer, target) => {
        clearTimeout(timer)
        stripReveal(target)
      })
      pendingTargets.clear()
    }
  }, [containerRef])
}

export default useScrollReveal
