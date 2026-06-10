/**
 * Resolves the absolute API endpoint URL based on the current hostname.
 * If running on localhost/127.0.0.1, it defaults to the local .NET Web API development server.
 * Otherwise in production, it falls back to a relative path (allowing Netlify proxying)
 * or uses a custom API URL injected via window.ORBITOPS_API_URL.
 * 
 * @param path The relative API path (e.g., '/api/chat')
 * @param localFallback The local fallback URL (e.g., 'http://localhost:5015/api/chat')
 */
export function resolveApiUrl(path: string, localFallback: string): string {
  if (typeof window !== 'undefined') {
    // Check for custom injected production API url
    if ((window as any).ORBITOPS_API_URL) {
      return `${(window as any).ORBITOPS_API_URL}${path}`;
    }
    
    // Check if running on localhost
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return localFallback;
    }
  }
  
  // Fall back to relative path for production deployments
  return path;
}
