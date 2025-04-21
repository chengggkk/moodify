import { NextResponse } from 'next/server';
import { generateRandomString, SPOTIFY_ENDPOINTS, SPOTIFY_SCOPES } from '../../lib/spotify';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Generate and store a state value to protect against CSRF
    const state = generateRandomString(16);
    
    // Create the redirect URL with properly joined scopes
    const spotifyAuthUrl = `${SPOTIFY_ENDPOINTS.AUTHORIZE}?${new URLSearchParams({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_SCOPES.join(' '),
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      state: state,
      show_dialog: true
    })}`;
    
    // Create a redirect response
    const response = NextResponse.redirect(spotifyAuthUrl);
    
    // Set cookie on the response object
    response.cookies.set('spotify_auth_state', state, { 
      maxAge: 60 * 5, // 5 minutes
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log('Redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
    return response;
  } catch (error) {
    console.error('Error in login API route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}