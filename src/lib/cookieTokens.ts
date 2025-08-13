import { NextRequest } from 'next/server';

export function getGoogleTokensFromCookies(request: NextRequest) {
  const accessToken = request.cookies.get('google_access_token')?.value;
  const rawRefreshToken = request.cookies.get('google_refresh_token')?.value;
  const refreshToken = rawRefreshToken ? decodeURIComponent(rawRefreshToken) : null;
  
  return {
    accessToken,
    refreshToken,
    hasTokens: !!(accessToken || refreshToken)
  };
}