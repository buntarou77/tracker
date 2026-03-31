'use client';

import { use, useEffect, useState } from 'react';
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
  const [userData, setUserData] = useState<{username: string, email: string, lastPasswordChange: Date, id: string}>({username: '', email: '', lastPasswordChange: new Date(), id: ''})
  
  const router = useRouter();
  const pathname = usePathname();
  const refreshTokens = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {

        return true;
      } else {

        return false;
      }
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    async function loadUser() {
    const isPublicPath = pathname === '/login' || pathname === '/register' || pathname === '/about';
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

            } else {
              setUser(null);
              setIsAuthenticated(false);
              if(!isPublicPath) router.push('/login');
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
            if(!isPublicPath) router.push('/login');
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          if(!isPublicPath) router.push('/login');
        }
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        if(!isPublicPath) router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }
    if(pathname.indexOf('login') !== -1 || pathname.indexOf('register') !== -1){
      return 
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