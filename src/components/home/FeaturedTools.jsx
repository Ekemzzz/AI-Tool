import SectionHeading from './SectionHeading.jsx'
import ToolGrid from './ToolGrid.jsx'

function FeaturedTools({ tools }) {
  return (
    <section className="home-section" aria-labelledby="featured-tools-title">
      <SectionHeading
        id="featured-tools-title"
        title="Featured tools"
        description="A small editorial selection from this sample catalog—not a popularity ranking."
      />
      <ToolGrid tools={tools.filter((tool) => tool.featured)} />
    </section>
  )
}

export default FeaturedTools
