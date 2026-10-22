const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export function getToken(){ return localStorage.getItem('hb_token'); }
export async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed. Please try again.');
  return data;
}
