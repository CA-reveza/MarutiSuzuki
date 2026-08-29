// Base URL of the AXIONIK backend.
//
// In local dev, this defaults to http://localhost:8000. In a deployed build
// (Vercel, Netlify, etc.) it defaults to an EMPTY string, which means every
// apiUrl() call becomes a relative path like "/api/testdrives" — that only
// works if this portal is served from the same origin as the backend.
//
// If the captive portal is deployed separately from the backend (the usual
// setup — e.g. portal on Vercel, API on Render), you MUST set VITE_API_URL
// in that project's environment variables to the full backend URL, e.g.
// https://marutisuzukis-api.onrender.com — and trigger a fresh build
// afterward, since Vite only reads env vars at build time. Without this,
// test drive bookings, coupon redemptions, and check-ins will appear to
// succeed on-screen but never actually reach the server.
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
