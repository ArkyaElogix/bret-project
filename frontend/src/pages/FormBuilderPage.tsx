import { Navigate, useParams } from 'react-router-dom'

export default function FormBuilderPage() {
  const { id } = useParams()

  return <Navigate to={`/forms/${id}/edit`} replace />
}