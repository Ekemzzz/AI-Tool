function SectionHeading({ title, description, id, action }) {
  return (
    <div className="section-heading">
      <div className="section-heading__copy">
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="section-heading__action">{action}</div>}
    </div>
  )
}

export default SectionHeading
