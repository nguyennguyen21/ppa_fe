import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../modules/lib/hook/auth-context';


export function ProtectedRoute({ children }: React.PropsWithChildren) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}