// Sets --spot-x/--spot-y on the card under the pointer so the CSS radial
// highlight (see .card-surface rules in home.css) follows the cursor.
function useCardSpotlight() {
  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--spot-x', `${Math.round(event.clientX - rect.left)}px`)
    event.currentTarget.style.setProperty('--spot-y', `${Math.round(event.clientY - rect.top)}px`)
  }

  return { onMouseMove: handleMouseMove }
}

export default useCardSpotlight
