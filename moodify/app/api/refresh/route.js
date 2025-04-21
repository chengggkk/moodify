// app/api/refresh/route.js
import { NextResponse } from 'next/server';
import { refreshAccessToken } from '../../lib/spotify';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get refresh token from cookies
    const refreshToken = cookies().get('spotify_refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token found' }, { status: 401 });
    }

    // Refresh the token
    const tokenResponse = await refreshAccessToken(refreshToken);
    
    if (tokenResponse.error) {
      // If refresh fails, redirect to login
      return NextResponse.json({ error: tokenResponse.error }, { status: 401 });
    }

    // Update the access token in cookies
    const { access_token, expires_in } = tokenResponse;
    
    cookies().set('spotify_access_token', access_token, {
      maxAge: expires_in,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in refresh API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}