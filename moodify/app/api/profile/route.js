// app/api/profile/route.js
import { NextResponse } from 'next/server';
import { getUserProfile } from '../../../lib/spotify';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get access token from cookies
    const accessToken = cookies().get('spotify_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch user profile from Spotify
    const profile = await getUserProfile(accessToken);
    
    // Check if there was an error from Spotify
    if (profile.error) {
      if (profile.error.status === 401) {
        // Token expired, attempt to refresh
        return NextResponse.redirect(new URL('/api/refresh', request.url));
      }
      
      return NextResponse.json({ error: profile.error.message }, { status: profile.error.status });
    }

    // Return the profile data
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in profile API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}