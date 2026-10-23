import { useEffect, useRef, useState } from 'react'

// Animates a number from 0 to `target` over `duration` ms.
// Re-runs every time `trigger` changes (e.g. pass a page-visit counter).
function useCountUp(target, duration = 1200, trigger = 0) {
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let start = null

    function step(timestamp) {
      // Reduced motion: land on the final value without animating.
      if (reduced) {
        setValue(target)
        return
      }
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration, trigger])

  return value
}

export default useCountUp
