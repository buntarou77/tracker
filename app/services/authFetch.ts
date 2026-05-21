export async function authFetch(url: string, options?: RequestInit) {
  const requestOptions: RequestInit = {
    ...options,
    credentials: 'include',
  };

  let res = await fetch(url, requestOptions);

  if (res.status === 401 && !url.includes('/api/auth/refresh')) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      res = await fetch(url, requestOptions);
    }
  }

  return res;
}