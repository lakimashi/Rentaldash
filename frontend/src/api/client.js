const getToken = () => localStorage.getItem('rental_token');

export async function api(path, options = {}) {
  const token = getToken();
  console.log(`[API Request] ${options.method || 'GET'} ${path}`);

  try {
    const res = await fetch(path, {
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

    if (!res.ok) {
      console.error(`[API Error] ${res.status}:`, data);
      throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    }

    return data;
  } catch (err) {
    console.error(`[API Network Error]:`, err);
    if (err.message.toLowerCase().includes('fetch')) {
      throw new Error("Login failed. Please make sure the backend is running and connected.");
    }
    throw err;
  }
}
