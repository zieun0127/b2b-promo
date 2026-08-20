import { useAuthStore } from '../store/authStore';

const BASE_URL = '/api';

let refreshingPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return null;

  if (!refreshingPromise) {
    refreshingPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          clearAuth();
          return null;
        }
        const data = await res.json();
        setAccessToken(data.access_token);
        return data.access_token as string;
      })
      .catch(() => {
        clearAuth();
        return null;
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  _retry = false
): Promise<Response> {
  const { accessToken } = useAuthStore.getState();
  const headers = new Headers(options.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && !_retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(path, options, true);
    }
  }

  return response;
}
