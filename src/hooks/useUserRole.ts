
import { useState, useEffect } from 'react';

type UserRole = 'admin' | 'user';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // In production, this would check against your auth system
        // For now, we'll use localStorage to simulate admin access
        const storedRole = localStorage.getItem('userRole') as UserRole;
        
        // You can set admin role by running: localStorage.setItem('userRole', 'admin')
        // in browser console
        setUserRole(storedRole || 'user');
      } catch (error) {
        console.error('Failed to check user role:', error);
        setUserRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const isAdmin = userRole === 'admin';

  return {
    userRole,
    isAdmin,
    isLoading,
    setUserRole // For testing purposes
  };
};
