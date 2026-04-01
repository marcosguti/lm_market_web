import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/iniciar-sesion" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

