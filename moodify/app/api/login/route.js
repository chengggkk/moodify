// app/api/login/route.js
import { NextResponse } from 'next/server';
import { generateRandomString, SPOTIFY_ENDPOINTS, SPOTIFY_SCOPES } from '../../lib/spotify';

export async function GET() {
  try {
    // Generate and store a state value to protect against CSRF
    const state = generateRandomString(16);
    
    // Get the exact redirect URI from env
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    console.log('Using redirect URI in login:', redirectUri);
    
    // Create the redirect URL with properly joined scopes
    const spotifyAuthUrl = `${SPOTIFY_ENDPOINTS.AUTHORIZE}?${new URLSearchParams({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_SCOPES.join(' '),
      redirect_uri: redirectUri,
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

    return response;
  } catch (error) {
    console.error('Error in login API route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}