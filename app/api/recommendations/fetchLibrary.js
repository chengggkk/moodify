import { fetchFromSpotify } from './spotifyHelpers.js';
import { shuffleArray } from './utils.js';

export async function fetchLibrary(token) {
  try {
    console.log("Fetching user's library tracks...");
    const timeRanges = ['medium_term', 'short_term', 'long_term'];
    let allTopTracks = [];
    
    // Use Set and Map for more efficient duplicate tracking
    const trackIds = new Set();
    const trackMap = new Map();
    
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
          
          // Add tracks and remove duplicates immediately
          for (const track of topTracksResponse.items) {
            if (track && track.id && !trackIds.has(track.id)) {
              trackIds.add(track.id);
              trackMap.set(track.id, {
                ...track,
                source: `top_tracks_${timeRange}`,
                addedAt: new Date().toISOString()
              });
            }
          }
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
        
        // Add recently played tracks, avoiding duplicates
        for (const item of recentlyPlayedResponse.items) {
          const track = item.track;
          if (track && track.id && !trackIds.has(track.id)) {
            trackIds.add(track.id);
            trackMap.set(track.id, {
              ...track,
              source: 'recently_played',
              addedAt: item.played_at || new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.warn("Error fetching recently played:", error.message);
    }
    
    // Get saved tracks
    try {
      console.log("Fetching saved tracks...");
      let offset = 0;
      const limit = 50;
      let hasMoreTracks = true;
      
      while (hasMoreTracks && trackMap.size < 500) { // Increased limit and use trackMap.size
        const savedTracksResponse = await fetchFromSpotify(
          `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
          token
        );
        
        if (savedTracksResponse && savedTracksResponse.items && savedTracksResponse.items.length > 0) {
          console.log(`Found ${savedTracksResponse.items.length} saved tracks (offset: ${offset})`);
          
          // Add saved tracks, avoiding duplicates
          for (const item of savedTracksResponse.items) {
            const track = item.track;
            if (track && track.id && !trackIds.has(track.id)) {
              trackIds.add(track.id);
              trackMap.set(track.id, {
                ...track,
                source: 'saved_tracks',
                addedAt: item.added_at || new Date().toISOString()
              });
            }
          }
          
          offset += limit;
          hasMoreTracks = savedTracksResponse.items.length === limit;
        } else {
          hasMoreTracks = false;
        }
      }
    } catch (error) {
      console.warn("Error fetching saved tracks:", error.message);
    }
    
    // Convert Map to Array for final processing
    const uniqueTracks = Array.from(trackMap.values());
    
    // Additional validation and cleaning
    const cleanedTracks = uniqueTracks.filter(track => {
      // Ensure track has required properties
      if (!track || !track.id || !track.name || !track.artists || track.artists.length === 0) {
        return false;
      }
      
      // Filter out very short tracks (likely intros/outros)
      if (track.duration_ms && track.duration_ms < 30000) { // Less than 30 seconds
        return false;
      }
      
      // Filter out tracks with null/undefined essential data
      if (!track.artists[0].name || track.name.trim() === '') {
        return false;
      }
      
      return true;
    });
    
    // Remove duplicate tracks by name + artist combination (in case of same song, different releases)
    const trackSignatures = new Set();
    const finalUniqueTracks = [];
    
    for (const track of cleanedTracks) {
      const signature = `${track.name.toLowerCase().trim()}-${track.artists[0].name.toLowerCase().trim()}`;
      
      if (!trackSignatures.has(signature)) {
        trackSignatures.add(signature);
        finalUniqueTracks.push(track);
      } else {
        console.log(`Duplicate found and removed: ${track.name} by ${track.artists[0].name}`);
      }
    }
    
    console.log(`Library fetch complete:`);
    console.log(`- Total tracks collected: ${uniqueTracks.length}`);
    console.log(`- After validation: ${cleanedTracks.length}`);
    console.log(`- Final unique tracks: ${finalUniqueTracks.length}`);
    console.log(`- Duplicates removed: ${uniqueTracks.length - finalUniqueTracks.length}`);
    
    // Shuffle and return all unique tracks
    return shuffleArray(finalUniqueTracks);
  } catch (error) {
    console.error("Error fetching user's library:", error);
    return [];
  }
}