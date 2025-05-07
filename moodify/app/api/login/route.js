// app/api/login/route.js
import { NextResponse } from 'next/server';
import { generateRandomString, SPOTIFY_ENDPOINTS, SPOTIFY_SCOPES } from '../../lib/spotify';

export async function GET() {
  try {
    // Generate a state value for CSRF protection
    const state = generateRandomString(16);
    
    // IMPORTANT: Use the exact redirect URI that's registered in Spotify Dashboard
    // NOTE: We're hardcoding this value to ensure it matches exactly
    const redirectUri = 'http://127.0.0.1:3000/api/callback';
    
    // Log values for debugging
    console.log('Starting Spotify login flow');
    console.log('Redirect URI:', redirectUri);
    
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      console.error('SPOTIFY_CLIENT_ID is missing in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Spotify client ID' }, 
        { status: 500 }
      );
    }
    
    // Build the authorization URL with explicit parameters
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SPOTIFY_SCOPES.join(' '),
      redirect_uri: redirectUri,
      state: state,
      show_dialog: true // Always show the dialog to avoid caching issues
    });
    
    const spotifyAuthUrl = `${SPOTIFY_ENDPOINTS.AUTHORIZE}?${authParams.toString()}`;
    console.log('Auth URL generated (client_id and other details omitted for security)');
    
    // Create the redirect response
    const response = NextResponse.redirect(spotifyAuthUrl);
    
    // Set state cookie for validation
    response.cookies.set('spotify_auth_state', state, { 
      maxAge: 60 * 5, // 5 minutes
      httpOnly: true, 
      secure: true,
      sameSite: 'lax'
    });

    console.log('Redirecting to Spotify authorization page');
    return response;
  } catch (error) {
    console.error('Error in login API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message }, 
      { status: 500 }
    );
  }
}