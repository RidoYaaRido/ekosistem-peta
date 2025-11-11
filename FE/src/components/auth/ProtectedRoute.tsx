import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, checkAuth, router]);

  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
