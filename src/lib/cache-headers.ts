// Let Netlify's CDN keep rendered job pages for 30 min (shared across visitors and
// function instances), so traffic doesn't translate into source API calls.
export function setJobPageCacheHeaders(headers: Headers) {
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('Netlify-CDN-Cache-Control', 'public, durable, s-maxage=1800, stale-while-revalidate=86400');
}
