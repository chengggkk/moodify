// app/api/callback/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Log the incoming request for debugging
    console.log('Callback API called');
    
    // Parse the request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Error parsing request body:', parseError.message);
      return NextResponse.json({ 
        error: 'Invalid request body', 
        details: parseError.message 
      }, { status: 400 });
    }
    
    const { code } = requestBody;
    
    if (!code) {
      console.error('No authorization code provided');
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }
    
    console.log('Authorization code received:', code.substring(0, 10) + '...');
    
    // Exchange authorization code for access token
    try {
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.SPOTIFY_REDIRECT_URI
        }).toString()
      });
      
      console.log('Token exchange response status:', tokenResponse.status);
      
      if (!tokenResponse.ok) {
        // Try to get error details from the response
        let errorText = 'Unknown error';
        try {
          errorText = await tokenResponse.text();
          console.error('Token exchange error response:', errorText);
        } catch (textError) {
          console.error('Could not read error response text');
        }
        
        return NextResponse.json({
          error: `Failed to exchange authorization code for token: ${tokenResponse.status} ${tokenResponse.statusText}`,
          details: errorText
        }, { status: tokenResponse.status });
      }
      
      // Parse token data
      let tokenData;
      try {
        tokenData = await tokenResponse.json();
        console.log('Token data received successfully');
      } catch (parseError) {
        console.error('Error parsing token response:', parseError.message);
        return NextResponse.json({ 
          error: 'Invalid token response from Spotify', 
          details: parseError.message 
        }, { status: 500 });
      }
      
      // Return the successful token response
      console.log('Returning successful token response');
      return NextResponse.json({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type
      });
      
    } catch (error) {
      console.error('Error in token exchange:', error.message);
      return NextResponse.json({ 
        error: 'Error exchanging code for token', 
        details: error.message 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in callback route:', error.message);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}