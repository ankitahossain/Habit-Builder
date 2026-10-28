// In production VITE_API_URL MUST be set (e.g. https://your-server.vercel.app/api).
const raw = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
const API = raw.replace(/\/+$/, '');
export function getToken(){ return localStorage.getItem('hb_token'); }
export async function api(path, options = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    });
  } catch {
    throw new Error('Cannot reach the server. Check VITE_API_URL and the server CORS setting (CLIENT_ORIGIN).');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Server error (${response.status}). Please try again.`);
  return data;
}
