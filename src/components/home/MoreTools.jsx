import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { getToolCategories } from '../../utils/catalog.js'
import SectionHeading from './SectionHeading.jsx'

function MoreTools({ tools }) {
  const additionalTools = tools.filter((tool) => !tool.featured).slice(0, 6)

  return (
    <section className="home-section home-section--more" aria-labelledby="more-tools-title">
      <SectionHeading
        id="more-tools-title"
        title="More tools in this sample catalog"
        description="An unranked sample of other products in the directory."
        action={
          <Link className="text-link" to="/tools">
            Browse all tools <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        }
      />
      <ul className="more-tools-list">
        {additionalTools.map((tool) => {
          const category = getToolCategories(tool)[0]
          return (
            <li className="more-tools-list__item" key={tool.id}>
              <div>
                <Link className="more-tools-list__name" to={`/tools/${tool.slug}`}>
                  {tool.name}
                </Link>
                <p>{tool.description}</p>
              </div>
              {category && (
                <Link className="more-tools-list__category" to={`/categories/${category.slug}`}>
                  {category.name}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default MoreTools
