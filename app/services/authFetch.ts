// Single-flight refresh: when several requests get a 401 at the same time,
// they all await the SAME refresh call instead of each firing their own
// (which previously caused a "refresh storm" and token races).
let refreshPromise: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function authFetch(url: string, options?: RequestInit) {
  const requestOptions: RequestInit = {
    ...options,
    credentials: 'include',
  };

  let res = await fetch(url, requestOptions);

  if (res.status === 401 && !url.includes('/api/auth/refresh')) {
    const refreshed = await refreshTokens();

    if (refreshed) {
      res = await fetch(url, requestOptions);
    } else if (typeof window !== 'undefined') {
      // Refresh token is gone/expired — send the user back to login instead of
      // leaving the UI stuck on failed requests.
      window.location.href = '/login';
    }
  }

  return res;
}
