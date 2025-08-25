
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'admin' | 'user';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        if (!user) {
          setUserRole('user');
          setIsLoading(false);
          return;
        }

        // Check user role from database using the secure function
        const { data, error } = await supabase.rpc('get_current_user_role');
        
        if (error) {
          console.error('Failed to check user role:', error);
          setUserRole('user');
        } else {
          setUserRole(data || 'user');
        }
      } catch (error) {
        console.error('Failed to check user role:', error);
        setUserRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  const isAdmin = userRole === 'admin';

  return {
    userRole,
    isAdmin,
    isLoading
  };
};
