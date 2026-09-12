import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function RequireRole({ roles, children }) {
  const { role } = useAuth();

  if (!roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
