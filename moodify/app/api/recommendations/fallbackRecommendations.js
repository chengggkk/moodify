import OpenAI from "openai";
import { getUserTopArtists, getArtistTracks } from './trackEvaluator.js';
import { enhancedFeatureAnalysis } from './auddAnalyzer.js';
import { evaluateTrackAlignment } from './trackEvaluator.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateFallbackRecommendations(token, prompt, mood, currentTracks = [], targetCount = 10) {
  try {
    console.log(`Generating fallback recommendations to reach ${targetCount} tracks`);
    
    // Step 1: Get user's top artists
    const topArtists = await getUserTopArtists(token, 5);
    
    if (topArtists.length === 0) {
      console.warn('No top artists found, trying alternative approach...');
      // Alternative: use Spotify recommendations API directly
      return await getSpotifyRecommendations(token, mood, targetCount);
    }

    console.log(`Found ${topArtists.length} top artists:`, topArtists.map(a => a.name));

    // Step 2: Get actual tracks from Spotify for these artists
    let fallbackTracks = [];
    const existingTrackIds = new Set(currentTracks.map(t => t.id));
    
    for (const artist of topArtists) {
      if (fallbackTracks.length >= targetCount * 2) break; // Get more than needed for selection
      
      const artistTracks = await getArtistTracks(artist.id, token, 10); // Get more tracks per artist
      
      // Filter out tracks we already have
      const newTracks = artistTracks.filter(track => !existingTrackIds.has(track.id));
      
      fallbackTracks.push(...newTracks);
    }

    // Remove duplicates
    const uniqueFallbackTracks = [];
    const trackIds = new Set();
    
    for (const track of fallbackTracks) {
      if (!trackIds.has(track.id)) {
        uniqueFallbackTracks.push(track);
        trackIds.add(track.id);
      }
    }

    console.log(`Generated ${uniqueFallbackTracks.length} fallback tracks from top artists`);

    if (uniqueFallbackTracks.length === 0) {
      console.warn('No fallback tracks from artists, using Spotify recommendations API');
      return await getSpotifyRecommendations(token, mood, targetCount);
    }

    // Step 3: Analyze features with enhanced analysis (with fallbacks)
    const tracksWithFeatures = await enhancedFeatureAnalysis(uniqueFallbackTracks, token);

    // Step 4: Evaluate alignment with more lenient criteria
    const evaluation = await evaluateTrackAlignment(tracksWithFeatures, prompt, mood);
    
    // Return high-quality tracks up to target count, but be more generous
    let selectedTracks = evaluation.highQualityTracks.slice(0, targetCount);
    
    // If still not enough, add some of the "low quality" tracks too
    if (selectedTracks.length < targetCount && evaluation.lowQualityTracks.length > 0) {
      const additionalTracks = evaluation.lowQualityTracks
        .sort((a, b) => (b.alignmentScore || 0) - (a.alignmentScore || 0)) // Sort by score
        .slice(0, targetCount - selectedTracks.length);
      
      selectedTracks = [...selectedTracks, ...additionalTracks];
      console.log(`Added ${additionalTracks.length} additional tracks to reach target`);
    }
    
    console.log(`Selected ${selectedTracks.length} fallback tracks`);
    return selectedTracks;

  } catch (error) {
    console.error('Error generating fallback recommendations:', error);
    // Last resort: use Spotify recommendations API
    return await getSpotifyRecommendations(token, mood, targetCount);
  }
}

// New function to use Spotify's recommendations API as ultimate fallback
async function getSpotifyRecommendations(token, mood, limit = 10) {
  try {
    console.log(`Using Spotify recommendations API for mood: ${mood}`);
    
    // Map mood to audio features for better recommendations
    const moodToFeatures = {
      'energetic': 'min_energy=0.7&target_valence=0.6',
      'calm': 'max_energy=0.4&target_valence=0.5',
      'melancholy': 'max_energy=0.5&target_valence=0.3',
      'upbeat': 'min_energy=0.6&min_valence=0.6',
      'sad': 'max_energy=0.4&max_valence=0.3',
      'happy': 'min_valence=0.7&min_energy=0.5', // More lenient for happy
      'focused': 'target_energy=0.5&max_valence=0.6',
      'relaxed': 'max_energy=0.4&target_valence=0.5',
      'party': 'min_energy=0.7&min_danceability=0.7',
      'romantic': 'target_energy=0.5&target_valence=0.5',
      'balanced': 'target_energy=0.5&target_valence=0.5'
    };
    
    // Map mood to genres for seed
    const moodToGenre = {
      'energetic': 'pop,rock,electronic',
      'calm': 'ambient,chill,acoustic',
      'melancholy': 'indie,folk,alternative',
      'upbeat': 'pop,dance,funk',
      'sad': 'indie,folk,singer-songwriter',
      'happy': 'pop,funk,disco', // Better genres for happy
      'focused': 'instrumental,classical,ambient',
      'relaxed': 'chill,jazz,acoustic',
      'party': 'dance,electronic,pop',
      'romantic': 'r-n-b,soul,jazz',
      'balanced': 'pop,rock,indie'
    };
    
    const genreSeed = moodToGenre[mood.toLowerCase()] || 'pop,rock,indie';
    const audioFeatures = moodToFeatures[mood.toLowerCase()] || '';
    
    const { fetchFromSpotify } = await import('./spotifyHelpers.js');
    
    const recResponse = await fetchFromSpotify(
      `https://api.spotify.com/v1/recommendations?seed_genres=${genreSeed}&${audioFeatures}&limit=${limit}`, 
      token
    );
    
    if (recResponse && recResponse.tracks && recResponse.tracks.length > 0) {
      console.log(`Got ${recResponse.tracks.length} tracks from Spotify recommendations API`);
      return recResponse.tracks.map(track => ({
        ...track,
        alignmentScore: 7, // Give these a decent score
        alignmentReason: 'From Spotify recommendations API'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error using Spotify recommendations API:', error);
    return [];
  }
}

// Export the getSpotifyRecommendations function for use in other modules
export { getSpotifyRecommendations };

async function getAIArtistRecommendations(artists, prompt, mood) {
  try {
    const artistNames = artists.map(a => a.name).join(', ');
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [
        {
          role: "system",
          content: `You are a music expert recommending specific songs by given artists that match a user's mood and prompt.
          
          For each artist, suggest 3-5 of their most popular songs that would fit the mood.
          Return ONLY a JSON array with objects containing:
          - "artist": artist name
          - "songs": array of song titles
          
          Focus on well-known songs that match the mood.`
        },
        {
          role: "user",
          content: `User prompt: "${prompt}"
          Target mood: "${mood}"
          Artists: ${artistNames}
          
          Recommend specific songs by these artists that match the mood.`
        }
      ],
      temperature: 0.5,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content || "";
    
    try {
      const jsonStr = content.replace(/```json|```/g, '').trim();
      const recommendations = JSON.parse(jsonStr);
      
      console.log('AI artist recommendations:', recommendations);
      return recommendations;
    } catch (parseError) {
      console.error('Failed to parse AI artist recommendations:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error getting AI artist recommendations:', error);
    return [];
  }
}