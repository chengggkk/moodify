import { NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Spotify credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

async function fetchFromSpotify(url, token) {
  try {
    console.log("Fetching from Spotify:", url);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // For debugging
      console.warn(`Spotify API warning (${response.status}): ${url}`);
      
      if (response.status === 404) {
        // Return empty object for 404
        return { tracks: [] };
      }
      
      // Try to parse error
      try {
        const errorData = await response.json();
        throw new Error(`Spotify API error: ${errorData.error?.message || response.statusText}`);
      } catch (e) {
        // If parsing fails
        throw new Error(`Spotify API error: ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching from Spotify (${url}):`, error.message);
    throw error;
  }
}

async function analyzeMood(prompt) {
  try {
    // Use OpenAI to analyze the mood
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a music expert who can analyze mood descriptions. Output ONLY a simple JSON with one property "mood" which should be a single word like: energetic, calm, melancholy, upbeat, sad, etc.`
        },
        {
          role: "user",
          content: `What mood best describes this: "${prompt}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Try to extract JSON
    try {
      const result = JSON.parse(content);
      return result.mood || "balanced";
    } catch (parseError) {
      // If we can't parse JSON, look for a single word
      const moodMatch = content.match(/["']?(\w+)["']?/);
      return moodMatch ? moodMatch[1] : "balanced";
    }
  } catch (error) {
    console.error('Error analyzing mood:', error);
    return "balanced";
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      token, 
      seedTracks = [], 
      customStory = "", 
      createPlaylistFlag = false, 
      playlistName = "", 
      manualTracks = [] 
    } = body;

    // Handle playlist creation if that's what we're doing
    if (createPlaylistFlag && manualTracks && manualTracks.length > 0) {
      return await createSpotifyPlaylist(token, playlistName, manualTracks, customStory);
    }

    // Validate required data
    if (!token) {
      return NextResponse.json({ error: 'Spotify access token is required' }, { status: 400 });
    }

    // For creating recommendations, we need a prompt
    if (!createPlaylistFlag && !prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Step 1: Analyze the mood from prompt
    const mood = await analyzeMood(prompt);
    console.log("Mood analysis:", mood);

    let recommendations = [];
    
    // Step 2: Get user's top tracks
    try {
      console.log("Fetching user's top tracks...");
      const timeRanges = ['medium_term', 'short_term', 'long_term'];
      let allTopTracks = [];
      
      // Try to get tracks from each time range
      for (const timeRange of timeRanges) {
        try {
          console.log(`Fetching top tracks for ${timeRange}...`);
          const topTracksResponse = await fetchFromSpotify(
            `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, 
            token
          );
          
          if (topTracksResponse && topTracksResponse.items && topTracksResponse.items.length > 0) {
            console.log(`Found ${topTracksResponse.items.length} tracks from ${timeRange}`);
            allTopTracks.push(...topTracksResponse.items);
          }
        } catch (error) {
          console.warn(`Error fetching top tracks for ${timeRange}:`, error.message);
        }
      }
      
      // Get recently played tracks
      try {
        console.log("Fetching recently played tracks...");
        const recentlyPlayedResponse = await fetchFromSpotify(
          'https://api.spotify.com/v1/me/player/recently-played?limit=50',
          token
        );
        
        if (recentlyPlayedResponse && recentlyPlayedResponse.items) {
          console.log(`Found ${recentlyPlayedResponse.items.length} recently played tracks`);
          // Add each track from recently played
          allTopTracks.push(...recentlyPlayedResponse.items.map(item => item.track));
        }
      } catch (error) {
        console.warn("Error fetching recently played:", error.message);
      }
      
      // Remove duplicates
      const uniqueTracks = [];
      const trackIds = new Set();
      
      for (const track of allTopTracks) {
        if (track && track.id && !trackIds.has(track.id)) {
          uniqueTracks.push(track);
          trackIds.add(track.id);
        }
      }
      
      console.log(`Found ${uniqueTracks.length} unique tracks from user's library`);
      
      // Select a random subset of tracks - this avoids making complex API calls that might fail
      const randomTracks = shuffleArray(uniqueTracks).slice(0, 10);
      
      if (randomTracks.length > 0) {
        recommendations = randomTracks;
        console.log(`Selected ${recommendations.length} random tracks from user's library`);
      }
    } catch (error) {
      console.error("Error getting user's library tracks:", error);
    }
    
    // If we don't have enough recommendations, try to use new releases
    if (recommendations.length < 5) {
      console.log("Not enough recommendations from library, getting new releases...");
      
      try {
        const newReleasesResponse = await fetchFromSpotify('https://api.spotify.com/v1/browse/new-releases?limit=10', token);
        
        if (newReleasesResponse && newReleasesResponse.albums && newReleasesResponse.albums.items.length > 0) {
          // Get tracks from each album
          for (const album of newReleasesResponse.albums.items) {
            if (recommendations.length >= 10) break;
            
            try {
              const albumTracksResponse = await fetchFromSpotify(`https://api.spotify.com/v1/albums/${album.id}/tracks?limit=1`, token);
              
              if (albumTracksResponse && albumTracksResponse.items && albumTracksResponse.items.length > 0) {
                const track = albumTracksResponse.items[0];
                // Add album info to track
                track.album = album;
                
                // Check if track is already in recommendations
                if (!recommendations.some(r => r.id === track.id)) {
                  recommendations.push(track);
                }
              }
            } catch (error) {
              console.warn(`Error fetching album tracks:`, error.message);
            }
          }
          
          console.log(`Added ${recommendations.length} tracks from new releases`);
        }
      } catch (error) {
        console.warn(`Error fetching new releases:`, error.message);
      }
    }

    // If we still don't have enough recommendations, return error
    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json({ 
        error: 'Could not generate recommendations with the provided parameters'
      }, { status: 404 });
    }

    console.log(`Final recommendation count: ${recommendations.length}`);

    // Step 4: Generate a story based on the recommendations and prompt
    let story = '';
    try {
      // Get song names and artists for context
      const tracksInfo = recommendations.map(track => {
        return {
          name: track.name,
          artists: track.artists.map(artist => artist.name).join(', ')
        };
      });

      // Prepare prompt for OpenAI
      let aiPrompt = customStory 
        ? `Based on this custom theme: "${customStory}", write a short paragraph that connects these songs into a cohesive playlist narrative.`
        : `Write a short, engaging paragraph about how this playlist matches the mood: "${prompt}".`;
      
      aiPrompt += ` Here are the songs: ${JSON.stringify(tracksInfo)}. Keep it concise and personal.`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a music expert who writes creative, evocative descriptions of playlists." },
          { role: "user", content: aiPrompt }
        ],
        max_tokens: 250
      });

      story = aiResponse.choices[0]?.message?.content || "";
    } catch (aiError) {
      console.error('Error generating story with AI:', aiError);
      // Fallback to simple story if AI fails
      story = `A playlist curated for your "${prompt}" mood.`;
    }

    // Create a simplified audioFeatures object for the frontend
    const audioFeatures = {
      energy: mood === "energetic" || mood === "upbeat" ? 0.8 : mood === "calm" || mood === "sad" ? 0.3 : 0.5,
      valence: mood === "happy" || mood === "upbeat" ? 0.8 : mood === "sad" || mood === "melancholy" ? 0.2 : 0.5,
      danceability: mood === "party" || mood === "dance" ? 0.8 : mood === "calm" || mood === "focused" ? 0.3 : 0.5,
    };

    // Return the recommendations, mood and story
    return NextResponse.json({
      recommendations: recommendations,
      audioFeatures: audioFeatures,
      mood: mood,
      story: story
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Helper function: Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Playlist creation function
async function createSpotifyPlaylist(token, playlistName, tracks, description) {
  try {
    console.log("Creating playlist with tracks:", JSON.stringify(tracks.map(t => t.name || t.id)));

    // 1. Get user profile to get user ID
    const userProfile = await fetchFromSpotify('https://api.spotify.com/v1/me', token);
    const userId = userProfile.id;

    if (!userId) {
      throw new Error('Could not determine user ID');
    }

    console.log("Creating playlist for user:", userId);

    // 2. Create a new playlist
    const createPlaylistUrl = `https://api.spotify.com/v1/users/${userId}/playlists`;
    const playlistResponse = await fetch(createPlaylistUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: playlistName || 'Moodify Playlist',
        description: description || 'Created with Moodify',
        public: false
      })
    });

    if (!playlistResponse.ok) {
      const errorText = await playlistResponse.text();
      console.error("Playlist creation error response:", errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`Failed to create playlist: ${errorData.error?.message || playlistResponse.statusText}`);
      } catch (e) {
        throw new Error(`Failed to create playlist: ${playlistResponse.statusText}`);
      }
    }

    const playlist = await playlistResponse.json();
    console.log("Playlist created:", playlist.id);

    // 3. Add tracks to the playlist - ensure we have valid URIs
    const trackUris = tracks.map(track => {
      // Check if it already has a URI
      if (track.uri && track.uri.startsWith('spotify:track:')) {
        return track.uri;
      }
      // Check if it has an ID
      else if (track.id) {
        return `spotify:track:${track.id}`;
      }
      // Last resort, return null (will be filtered out)
      return null;
    }).filter(uri => uri !== null);

    if (trackUris.length === 0) {
      throw new Error('No valid track URIs to add to playlist');
    }

    console.log("Adding tracks to playlist:", trackUris);

    // Add the tracks in batches of 100 (Spotify API limit)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);

      const addTracksUrl = `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`;
      const addTracksResponse = await fetch(addTracksUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: batch
        })
      });

      if (!addTracksResponse.ok) {
        const errorText = await addTracksResponse.text();
        console.error("Track addition error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.warn(`Warning adding tracks to playlist: ${errorData.error?.message}`);
        } catch (e) {
          console.warn(`Warning adding tracks to playlist: ${addTracksResponse.statusText}`);
        }
        // Continue anyway - we at least created the playlist
      }
    }

    // 4. Return the created playlist
    return NextResponse.json({
      playlist: playlist,
      message: 'Playlist created successfully'
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to create playlist' }, { status: 500 });
  }
}