'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  id: number;
  login: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  const refreshTokens = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        console.log('Tokens refreshed successfully');
        return true;
      } else {
        console.log('Refresh token invalid or expired');
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setIsAuthenticated(true);
        } else if (response.status === 401) {
          console.log('Access token expired, trying to refresh...');
          const refreshSuccess = await refreshTokens();
          
          if (refreshSuccess) {
            const retryResponse = await fetch('/api/me', {
              method: 'GET',
              credentials: 'include'
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              setUser(retryData);
              setIsAuthenticated(true);
              console.log('Authentication restored after token refresh');
            } else {
              setUser(null);
              setIsAuthenticated(false);
              if (pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
                router.push('/');
              }
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
            if (pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
              router.push('/');
            }
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          if (pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
        if (pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
          router.push('/');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [pathname, router]);

  return { 
    user, 
    isAuthenticated,
    isLoading,
    refreshTokens
  };
}