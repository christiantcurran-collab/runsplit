// ============================================
// Strava API Integration
// ============================================

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_OAUTH_BASE = "https://www.strava.com/oauth";

export function getStravaClientId(): string {
  return process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || "";
}

export function getStravaClientSecret(): string {
  return process.env.STRAVA_CLIENT_SECRET || "";
}

export function getStravaRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/strava/callback`;
}

/**
 * Build the Strava OAuth authorization URL
 */
export function getStravaAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: getStravaClientId(),
    redirect_uri: getStravaRedirectUri(),
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all,profile:read_all",
    ...(state ? { state } : {}),
  });
  return `${STRAVA_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeStravaCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
  };
}> {
  const res = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getStravaClientId(),
      client_secret: getStravaClientSecret(),
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strava token exchange failed: ${err}`);
  }

  return res.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshStravaToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
}> {
  const res = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getStravaClientId(),
      client_secret: getStravaClientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strava token refresh failed: ${err}`);
  }

  return res.json();
}

/**
 * Get a valid access token, refreshing if expired
 */
export async function getValidStravaToken(
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  onRefresh: (newTokens: { access_token: string; refresh_token: string; expires_at: number }) => Promise<void>
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt > now + 60) {
    return accessToken;
  }

  // Token expired or expiring soon, refresh
  const newTokens = await refreshStravaToken(refreshToken);
  await onRefresh(newTokens);
  return newTokens.access_token;
}

/**
 * Fetch activities from Strava
 */
export async function fetchStravaActivities(
  accessToken: string,
  params?: { after?: number; before?: number; page?: number; per_page?: number }
): Promise<StravaApiActivity[]> {
  const searchParams = new URLSearchParams();
  if (params?.after) searchParams.set("after", params.after.toString());
  if (params?.before) searchParams.set("before", params.before.toString());
  searchParams.set("page", (params?.page || 1).toString());
  searchParams.set("per_page", (params?.per_page || 50).toString());

  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strava activities fetch failed: ${err}`);
  }

  return res.json();
}

/**
 * Fetch athlete profile from Strava
 */
export async function fetchStravaAthlete(accessToken: string): Promise<StravaApiAthlete> {
  const res = await fetch(`${STRAVA_API_BASE}/athlete`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Strava athlete");
  }

  return res.json();
}

/**
 * Deauthorize Strava (revoke access)
 */
export async function deauthorizeStrava(accessToken: string): Promise<void> {
  await fetch(`${STRAVA_OAUTH_BASE}/deauthorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  });
}

// ============================================
// Strava API Types
// ============================================

export interface StravaApiActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number;
  calories?: number;
  map?: {
    summary_polyline?: string;
  };
}

export interface StravaApiAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  city: string;
  state: string;
  country: string;
}

