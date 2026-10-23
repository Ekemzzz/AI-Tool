function RoutePlaceholder({ title, description, children }) {
  return (
    <section className="page-intro reading-width" aria-labelledby="page-title">
      <h1 id="page-title">{title}</h1>
      <p>{description}</p>
      {children}
    </section>
  )
}

export default RoutePlaceholder
