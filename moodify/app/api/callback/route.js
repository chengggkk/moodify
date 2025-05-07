// app/api/callback/route.js
import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '../../lib/spotify';

// This handles the GET request when Spotify redirects back to your app
export async function GET(request) {
  try {
    // Get URL parameters from the request
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('Callback URL received - checking parameters');

    // Check for error parameter from Spotify
    if (error) {
      console.error('Error returned from Spotify:', error);
      return NextResponse.redirect(`${url.origin}?error=${encodeURIComponent(error)}`);
    }

    // Verify authorization code exists
    if (!code) {
      console.error('No authorization code provided');
      return NextResponse.redirect(`${url.origin}?error=${encodeURIComponent('Authorization code missing')}`);
    }

    // Use the exact same redirect URI that was used in the authorization request
    // IMPORTANT: This must match exactly with what's registered in Spotify Dashboard
    const redirectUri = 'http://127.0.0.1:3000/api/callback';

    console.log('Exchanging code for tokens with redirect URI:', redirectUri);

    // Exchange the code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Set tokens in cookies or redirect with token in URL fragment
    // We'll use a redirect with fragment (for client-side processing) for security
    const redirectUrl = new URL(url.origin);
    redirectUrl.searchParams.set('access_token', tokens.access_token);
    redirectUrl.searchParams.set('expires_in', tokens.expires_in.toString());
    redirectUrl.searchParams.set('token_received', 'true');

    console.log('Redirecting back to app with tokens');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Error in callback route:', error);
    const redirectUrl = new URL(new URL(request.url).origin);
    redirectUrl.searchParams.set('error', encodeURIComponent('Authentication failed: ' + error.message));
    return NextResponse.redirect(redirectUrl);
  }
}

// This handles POST requests from your frontend when it needs to exchange a code for tokens
export async function POST(request) {
  try {
    // Parse the request body
    const requestBody = await request.json();
    console.log('Callback API POST called with code length:', requestBody.code?.length || 'no code');
    
    const { code } = requestBody;
    
    if (!code) {
      console.error('No authorization code provided in POST body');
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }
    
    // Use the exact same redirect URI that was used in the authorization request
    // IMPORTANT: This must match exactly what's registered in Spotify Dashboard
    const redirectUri = 'http://127.0.0.1:3000/api/callback';
    
    // Exchange the code for tokens using our updated spotify utility function
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    
    // Return the tokens in the response
    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type
    });
    
  } catch (error) {
    console.error('Error in callback POST route:', error);
    return NextResponse.json({ 
      error: 'Error exchanging code for token', 
      details: error.message 
    }, { status: 500 });
  }
}