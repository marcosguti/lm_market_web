import { Navigate, useLocation } from 'react-router-dom';

import { PATHS } from '../../constants/paths';
import { isValidEmailVerificationState } from '../../types/emailVerification';

interface VerifyEmailRouteProps {
  children: React.ReactNode;
}

function VerifyEmailRoute({ children }: VerifyEmailRouteProps) {
  const location = useLocation();

  if (!isValidEmailVerificationState(location.state)) {
    return <Navigate to={PATHS.login} replace />;
  }

  return <>{children}</>;
}

export default VerifyEmailRoute;
