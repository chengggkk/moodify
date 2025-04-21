// app/api/logout/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Clear all Spotify related cookies
  cookies().delete('spotify_access_token');
  cookies().delete('spotify_refresh_token');
  cookies().delete('spotify_auth_state');

  return NextResponse.json({ success: true });
}