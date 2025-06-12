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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('../api/me',{
          method: 'GET',
          credentials: 'include'
        });
        console.log(response)
        if (response.ok) {
        
          const data = await response.json();
          setUser(data.user);
        } else {
          if (pathname !== '/login' && pathname !== '/register') {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (pathname !== '/login' && pathname !== '/register') {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [pathname, router]);

  return { user, loading };
}