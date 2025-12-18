/**
 * Admin authentication utilities
 */

import { headers } from 'next/headers';

/**
 * Checks if the request has valid admin token
 * Supports both query param and header
 */
export function checkAdminAuth(request?: Request): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret) {
    // If no secret is configured, allow access (for development)
    return true;
  }

  // Check header
  if (request) {
    const token = request.headers.get('X-Admin-Token');
    if (token === adminSecret) {
      return true;
    }

    // Check query param from URL
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('token');
    if (queryToken === adminSecret) {
      return true;
    }
  }

  return false;
}

/**
 * Gets admin token from request (for client-side use)
 */
export function getAdminTokenFromRequest(request: Request): string | null {
  const token = request.headers.get('X-Admin-Token');
  if (token) return token;

  const url = new URL(request.url);
  return url.searchParams.get('token');
}
