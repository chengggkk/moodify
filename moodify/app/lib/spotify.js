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

        // For debugging
        console.log(`Fetching from Spotify: ${url}`);

        const response = await fetch(url, fetchOptions);

        // Handle non-OK responses
        if (!response.ok) {
            console.warn(`Spotify API warning (${response.status}): ${url}`);

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

        if (!response.ok) {
            const errorData = await response.json();
            return {
                error: errorData.error || 'Failed to refresh token',
                status: response.status,
            };
        }

        return await response.json();
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return { error: 'Internal server error during token refresh' };
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
        // First, create an empty playlist
        const createResponse = await fetchFromSpotify(
            `${SPOTIFY_ENDPOINTS.CREATE_PLAYLIST}${userId}/playlists`,
            token,
            {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    description,
                    public: false
                })
            }
        );

        // Get the new playlist ID
        const playlistId = createResponse.id;

        if (!playlistId) {
            throw new Error('Failed to create playlist: No playlist ID returned');
        }

        // Then, add tracks to the playlist
        const trackUris = tracks.map(track =>
            typeof track === 'string' ? `spotify:track:${track}` : track.uri || `spotify:track:${track.id}`
        );

        // Spotify only allows 100 tracks at a time, so we need to chunk
        const chunkSize = 100;
        for (let i = 0; i < trackUris.length; i += chunkSize) {
            const chunk = trackUris.slice(i, i + chunkSize);

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

        // Return the newly created playlist
        return createResponse;
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
}