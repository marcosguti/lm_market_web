import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  allowedTypes?: string[];
  children: React.ReactNode;
}

function ProtectedRoute({ allowedTypes, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/iniciar-sesion" state={{ from: location }} replace />;
  }

  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(user.type)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
