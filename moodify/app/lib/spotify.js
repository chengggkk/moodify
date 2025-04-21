// lib/spotify.js

// Spotify API endpoints
export const SPOTIFY_ENDPOINTS = {
    AUTHORIZE: 'https://accounts.spotify.com/authorize',
    TOKEN: 'https://accounts.spotify.com/api/token',
    ME: 'https://api.spotify.com/v1/me',
    TOP_TRACKS: 'https://api.spotify.com/v1/me/top/tracks',
    TOP_ARTISTS: 'https://api.spotify.com/v1/me/top/artists',
    RECOMMENDATIONS: 'https://api.spotify.com/v1/recommendations',
    CREATE_PLAYLIST: 'https://api.spotify.com/v1/users/',
    SAVED_TRACKS: 'https://api.spotify.com/v1/me/tracks',
    RECENTLY_PLAYED: 'https://api.spotify.com/v1/me/player/recently-played',
    AUDIO_FEATURES: 'https://api.spotify.com/v1/audio-features',
};

// Define the scopes needed for your application - adding required scopes
export const SPOTIFY_SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-read-recently-played'
];

// Generate a random string for the state parameter
export function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

// Log response with sensitive information redacted
function logResponse(response, url) {
    // Only log headers and status, not body
    const headerObj = {};
    response.headers.forEach((value, key) => {
        // Redact potentially sensitive headers
        if (key.toLowerCase().includes('authorization') || 
            key.toLowerCase().includes('cookie') || 
            key.toLowerCase().includes('token')) {
            headerObj[key] = '[REDACTED]';
        } else {
            headerObj[key] = value;
        }
    });

    console.log(`Spotify API Response: ${url}`, {
        status: response.status,
        statusText: response.statusText,
        headers: headerObj
    });
}

// Improved error handling for Spotify API calls
export async function fetchFromSpotify(endpoint, token, options = {}) {
    try {
        const url = endpoint.startsWith('https://')
            ? endpoint
            : `https://api.spotify.com/v1/${endpoint}`;

        const fetchOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            ...options
        };

        // For debugging (with token redacted)
        console.log(`Fetching from Spotify: ${url}`, {
            method: fetchOptions.method || 'GET',
            headers: { ...fetchOptions.headers, Authorization: '[REDACTED]' }
        });

        const response = await fetch(url, fetchOptions);
        logResponse(response, url);

        // Handle non-OK responses
        if (!response.ok) {
            console.warn(`Spotify API warning (${response.status}): ${url}`);

            // Handle token expiration (401 Unauthorized)
            if (response.status === 401) {
                console.warn('Token appears to be expired or invalid');
                // If we want to handle token refresh here, we could
                // throw a special error type that the caller can catch
                throw new Error('SPOTIFY_TOKEN_EXPIRED');
            }

            // Special handling for 404 (not found) and 403 (forbidden)
            if (response.status === 404) {
                console.warn('Resource not found, returning empty result');
                // Return appropriate empty structure based on endpoint
                if (endpoint.includes('recommendations')) {
                    return { tracks: [] };
                } else if (endpoint.includes('tracks')) {
                    return { items: [] };
                } else {
                    return {};
                }
            }

            // Rate limit handling
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                console.warn(`Rate limited by Spotify. Retry after ${retryAfter} seconds`);
                throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
            }

            // Try to parse error as JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    throw new Error(`Spotify API error: ${errorData.error?.message || response.statusText}`);
                } catch (parseError) {
                    // If JSON parsing fails, use the status text
                    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
                }
            } else {
                // If not JSON, just throw with status
                throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
            }
        }

        // Parse the successful response
        try {
            return await response.json();
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Invalid response from Spotify API');
        }

    } catch (error) {
        console.error(`Error fetching from Spotify API (${endpoint}):`, error);
        throw error;
    }
}

// Function to get user profile information
export async function getUserProfile(token) {
    return fetchFromSpotify(SPOTIFY_ENDPOINTS.ME, token);
}

// Function to refresh an access token using a refresh token
export async function refreshAccessToken(refreshToken) {
    try {
        console.log('Refreshing Spotify access token');
        
        // Ensure client ID and secret are available
        if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
            console.error('Missing Spotify client credentials in environment variables');
            throw new Error('Missing Spotify client credentials');
        }

        const basicAuth = Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64');

        const response = await fetch(SPOTIFY_ENDPOINTS.TOKEN, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });

        // Log response status (but not content for security)
        console.log(`Token refresh response status: ${response.status}`);

        if (!response.ok) {
            let errorMessage = `Failed to refresh token: ${response.status} ${response.statusText}`;
            
            try {
                const errorData = await response.json();
                errorMessage = `${errorMessage} - ${errorData.error || 'Unknown error'}`;
            } catch (e) {
                // If can't parse JSON, continue with basic error
            }
            
            console.error(errorMessage);
            return {
                error: errorMessage,
                status: response.status,
            };
        }

        const tokenData = await response.json();
        console.log('Token refreshed successfully');
        
        return {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || refreshToken, // Sometimes Spotify returns a new refresh token
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type
        };
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return { error: 'Internal server error during token refresh' };
    }
}

// Function to validate and exchange an authorization code for tokens
export async function exchangeCodeForTokens(code, redirectUri) {
    try {
        console.log('Exchanging authorization code for tokens');
        
        // Verify we have the required environment variables
        if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
            throw new Error('Missing Spotify client credentials in environment variables');
        }
        
        // Create the basic auth header from client ID and secret
        const basicAuth = Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64');
            
        // Log the redirect URI being used (this is critical for debugging)
        console.log(`Using redirect URI: ${redirectUri}`);
        
        // Make the request to exchange the code for tokens
        const response = await fetch(SPOTIFY_ENDPOINTS.TOKEN, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
        });
        
        console.log(`Token exchange response status: ${response.status}`);
        
        if (!response.ok) {
            let errorText = `Failed to exchange code for token: ${response.status} ${response.statusText}`;
            
            try {
                const errorData = await response.json();
                errorText = `${errorText} - ${errorData.error || 'Unknown error'}`;
            } catch (e) {
                // If can't parse as JSON, continue with basic error
            }
            
            throw new Error(errorText);
        }
        
        const data = await response.json();
        console.log('Successfully exchanged code for tokens');
        
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            token_type: data.token_type
        };
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        throw error;
    }
}

// Function to get user's saved tracks (library)
export async function getUserSavedTracks(token, limit = 50) {
    return fetchFromSpotify(`${SPOTIFY_ENDPOINTS.SAVED_TRACKS}?limit=${limit}`, token);
}

// Function to get recently played tracks
export async function getRecentlyPlayedTracks(token, limit = 50) {
    return fetchFromSpotify(`${SPOTIFY_ENDPOINTS.RECENTLY_PLAYED}?limit=${limit}`, token);
}

// Get user's top tracks with configurable time range
export async function getUserTopTracks(token, timeRange = 'medium_term', limit = 50) {
    return fetchFromSpotify(`${SPOTIFY_ENDPOINTS.TOP_TRACKS}?time_range=${timeRange}&limit=${limit}`, token);
}

// Get audio features for multiple track IDs
export async function getAudioFeatures(token, trackIds) {
    if (!trackIds || trackIds.length === 0) {
        return { audio_features: [] };
    }

    // Spotify API can only handle 100 track IDs at once
    const batchSize = 100;
    const results = [];

    // Process track IDs in batches
    for (let i = 0; i < trackIds.length; i += batchSize) {
        const batch = trackIds.slice(i, i + batchSize);
        const ids = batch.join(',');

        try {
            const batchResults = await fetchFromSpotify(`${SPOTIFY_ENDPOINTS.AUDIO_FEATURES}?ids=${ids}`, token);

            if (batchResults && batchResults.audio_features) {
                results.push(...batchResults.audio_features);
            }
        } catch (error) {
            console.warn(`Error getting audio features for batch ${i}:`, error.message);
            // Continue with next batch despite errors
        }
    }

    return { audio_features: results.filter(item => item !== null) };
}

// Get recommendations based on seeds and audio features
export async function getRecommendations(token, options = {}) {
    try {
        if (!options) {
            throw new Error("Options parameter is required");
        }

        const { seedTracks, seedArtists, seedGenres, limit = 20, ...audioFeatures } = options;

        if (!seedTracks?.length && !seedArtists?.length && !seedGenres?.length) {
            throw new Error("At least one seed (tracks, artists, or genres) is required");
        }

        // Build query parameters
        const queryParams = new URLSearchParams();

        // Add seed tracks
        if (seedTracks?.length) {
            queryParams.append('seed_tracks', seedTracks.slice(0, 5).join(','));
        }

        // Add seed artists
        if (seedArtists?.length) {
            queryParams.append('seed_artists', seedArtists.slice(0, 5).join(','));
        }

        // Add seed genres
        if (seedGenres?.length) {
            queryParams.append('seed_genres', seedGenres.slice(0, 5).join(','));
        }

        // Add limit
        queryParams.append('limit', limit.toString());

        // Add audio features as target_* parameters
        for (const [feature, value] of Object.entries(audioFeatures)) {
            // Skip the 'mood' property which is not an audio feature for Spotify API
            if (feature !== 'mood' && typeof value === 'number') {
                queryParams.append(`target_${feature}`, value.toString());
            }
        }

        return fetchFromSpotify(`${SPOTIFY_ENDPOINTS.RECOMMENDATIONS}?${queryParams.toString()}`, token);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
    }
}

// Create a playlist with specified tracks
export async function createPlaylist(token, userId, name, description, tracks) {
    try {
        // Validate inputs
        if (!token) throw new Error('No access token provided');
        if (!userId) throw new Error('User ID is required to create a playlist');
        if (!name) throw new Error('Playlist name is required');
        if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
            throw new Error('At least one track is required to create a playlist');
        }

        console.log(`Creating playlist "${name}" for user ${userId} with ${tracks.length} tracks`);

        // First, create an empty playlist
        const createResponse = await fetchFromSpotify(
            `${SPOTIFY_ENDPOINTS.CREATE_PLAYLIST}${userId}/playlists`,
            token,
            {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    description: description || `Created by Moodify on ${new Date().toLocaleDateString()}`,
                    public: false
                })
            }
        );

        // Get the new playlist ID
        const playlistId = createResponse.id;

        if (!playlistId) {
            throw new Error('Failed to create playlist: No playlist ID returned');
        }

        console.log(`Playlist created with ID: ${playlistId}`);

        // Then, add tracks to the playlist
        const trackUris = tracks.map(track => {
            if (typeof track === 'string') {
                return track.startsWith('spotify:track:') ? track : `spotify:track:${track}`;
            } else {
                return track.uri || `spotify:track:${track.id}`;
            }
        });

        // Spotify only allows 100 tracks at a time, so we need to chunk
        const chunkSize = 100;
        for (let i = 0; i < trackUris.length; i += chunkSize) {
            const chunk = trackUris.slice(i, i + chunkSize);
            
            console.log(`Adding batch of ${chunk.length} tracks to playlist (${i+1}-${i+chunk.length}/${trackUris.length})`);

            await fetchFromSpotify(
                `playlists/${playlistId}/tracks`,
                token,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        uris: chunk
                    })
                }
            );
        }

        console.log(`Successfully added ${trackUris.length} tracks to playlist ${playlistId}`);

        // Return the newly created playlist
        return createResponse;
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
}

// Get track recommendations based on a text prompt or mood description
export async function getRecommendationsFromPrompt(token, prompt, userTopTracks = [], limit = 10) {
    try {
        if (!token) throw new Error('Access token is required');
        if (!prompt) throw new Error('Prompt is required');

        // Define common audio feature targets based on mood keywords in the prompt
        const lowerPrompt = prompt.toLowerCase();
        let audioFeatures = {};

        // Simple mood-to-audio-features mapping
        if (lowerPrompt.includes('energetic') || lowerPrompt.includes('workout') || lowerPrompt.includes('upbeat')) {
            audioFeatures = { energy: 0.8, valence: 0.7, tempo: 120 };
        } else if (lowerPrompt.includes('calm') || lowerPrompt.includes('relax') || lowerPrompt.includes('sleep')) {
            audioFeatures = { energy: 0.3, valence: 0.5, acousticness: 0.7, tempo: 80 };
        } else if (lowerPrompt.includes('happy') || lowerPrompt.includes('cheerful') || lowerPrompt.includes('joy')) {
            audioFeatures = { valence: 0.8, energy: 0.6 };
        } else if (lowerPrompt.includes('sad') || lowerPrompt.includes('melancholy') || lowerPrompt.includes('somber')) {
            audioFeatures = { valence: 0.2, mode: 0 };
        } else if (lowerPrompt.includes('focus') || lowerPrompt.includes('concentrate') || lowerPrompt.includes('study')) {
            audioFeatures = { instrumentalness: 0.5, energy: 0.4, acousticness: 0.6 };
        }

        // Use top tracks as seeds if available, or use genre seeds
        const options = {
            ...audioFeatures,
            limit
        };

        if (userTopTracks && userTopTracks.length > 0) {
            // Use up to 5 of the user's top tracks as seeds
            options.seedTracks = userTopTracks.slice(0, 5).map(track => track.id);
        } else {
            // If no top tracks, try to infer genre from prompt
            options.seedGenres = [];
            
            // Map prompt keywords to genres
            if (lowerPrompt.includes('rock')) options.seedGenres.push('rock');
            if (lowerPrompt.includes('pop')) options.seedGenres.push('pop');
            if (lowerPrompt.includes('hip hop') || lowerPrompt.includes('rap')) options.seedGenres.push('hip-hop');
            if (lowerPrompt.includes('jazz')) options.seedGenres.push('jazz');
            if (lowerPrompt.includes('classical')) options.seedGenres.push('classical');
            if (lowerPrompt.includes('electronic')) options.seedGenres.push('electronic');
            
            // If no specific genres in prompt, use some default popular genres
            if (options.seedGenres.length === 0) {
                options.seedGenres = ['pop', 'rock', 'indie', 'chill'];
            }
        }

        console.log('Getting recommendations with options:', JSON.stringify(options));
        return await getRecommendations(token, options);
    } catch (error) {
        console.error('Error getting recommendations from prompt:', error);
        throw error;
    }
}