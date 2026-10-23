import { useContext } from 'react'
import CompareContext from '../context/CompareContext.jsx'

function useCompare() {
  const context = useContext(CompareContext)
  if (!context) {
    throw new Error('useCompare must be used inside CompareProvider.')
  }
  return context
}

export default useCompare
