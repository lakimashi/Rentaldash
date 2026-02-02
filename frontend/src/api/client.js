const getToken = () => localStorage.getItem('rental_token');

export async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(path.startsWith('http') ? path : path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    body: options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
  return data;
}
