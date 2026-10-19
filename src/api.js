const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function saveSession({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  ['accessToken', 'refreshToken', 'user'].forEach((k) => localStorage.removeItem(k));
}

// true = new tokens saved, false = refresh token rejected, throws on network error
async function refreshAccess() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (res.status === 401 || res.status === 403) return false;
  if (!res.ok) throw new Error('Refresh failed');
  saveSession(await res.json());
  return true;
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const send = () => {
    const token = localStorage.getItem('accessToken');
    return fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let res = await send();
  if (res.status === 401 && auth) {
    if (await refreshAccess()) {
      res = await send();
    } else {
      clearSession();
      window.dispatchEvent(new Event('auth:logout'));
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}