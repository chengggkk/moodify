import OpenAI from "openai";
import { MongoClient } from 'mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'moodify';

async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);
    return { client, db };
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Function to fetch user feedback and preferences
async function getUserFeedbackData(userId) {
  let client = null;
  try {
    const { db, client: dbClient } = await connectToDatabase();
    client = dbClient;

    console.log(`Querying feedback for userId: ${userId}`);

    // Get user's feedback history - ensure userId is treated as string
    const userFeedback = await db.collection('userFeedback').find({ 
      userId: userId.toString() 
    }).toArray();
    
    console.log(`Raw feedback query result: ${userFeedback.length} items`);

    // Get user's computed preferences - ensure userId is treated as string
    const userPreferences = await db.collection('userPreferences').findOne({ 
      userId: userId.toString() 
    });

    console.log(`User preferences found: ${userPreferences ? 'Yes' : 'No'}`);

    // Organize feedback by track ID
    const trackFeedback = {};
    userFeedback.forEach(feedback => {
      trackFeedback[feedback.trackId] = feedback.feedback;
    });

    // Extract liked and disliked artists/genres for context
    let likedArtists = [];
    let dislikedArtists = [];
    let likedGenres = [];
    let dislikedGenres = [];

    if (userPreferences) {
      // Get top liked artists (positive scores)
      likedArtists = Object.entries(userPreferences.artists || {})
        .filter(([_, score]) => score > 0)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 10)
        .map(([artistId, _]) => artistId);

      // Get disliked artists (negative scores)
      dislikedArtists = Object.entries(userPreferences.artists || {})
        .filter(([_, score]) => score < 0)
        .map(([artistId, _]) => artistId);

      // Get liked genres
      likedGenres = Object.entries(userPreferences.genres || {})
        .filter(([_, score]) => score > 0)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 10)
        .map(([genre, _]) => genre);

      // Get disliked genres
      dislikedGenres = Object.entries(userPreferences.genres || {})
        .filter(([_, score]) => score < 0)
        .map(([genre, _]) => genre);
    }

    const result = {
      trackFeedback,
      userPreferences,
      likedArtists,
      dislikedArtists,
      likedGenres,
      dislikedGenres,
      totalFeedbacks: userFeedback.length
    };

    console.log(`Returning feedback data: ${result.totalFeedbacks} feedbacks, ${likedArtists.length} liked artists`);
    return result;

  } catch (error) {
    console.error('Error fetching user feedback data:', error);
    return {
      trackFeedback: {},
      userPreferences: null,
      likedArtists: [],
      dislikedArtists: [],
      likedGenres: [],
      dislikedGenres: [],
      totalFeedbacks: 0
    };
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

// Function to calculate track preference score based on user feedback data
function calculateTrackPreferenceScore(track, feedbackData) {
  let score = 0;
  let reasons = [];

  // Direct track feedback (highest priority)
  if (feedbackData.trackFeedback[track.id]) {
    const feedback = feedbackData.trackFeedback[track.id];
    if (feedback === 'like') {
      score += 10;
      reasons.push('Previously liked by user');
    } else if (feedback === 'dislike') {
      score -= 15; // Heavy penalty for disliked tracks
      reasons.push('Previously disliked by user');
    }
  }

  // Artist preferences
  if (track.artists && track.artists.length > 0) {
    track.artists.forEach(artist => {
      const artistId = artist.id;
      if (feedbackData.likedArtists.includes(artistId)) {
        score += 3;
        reasons.push(`Liked artist: ${artist.name}`);
      }
      if (feedbackData.dislikedArtists.includes(artistId)) {
        score -= 4;
        reasons.push(`Disliked artist: ${artist.name}`);
      }
    });
  }

  // Genre preferences (if available)
  if (track.genres && track.genres.length > 0) {
    track.genres.forEach(genre => {
      if (feedbackData.likedGenres.includes(genre)) {
        score += 2;
        reasons.push(`Liked genre: ${genre}`);
      }
      if (feedbackData.dislikedGenres.includes(genre)) {
        score -= 3;
        reasons.push(`Disliked genre: ${genre}`);
      }
    });
  }

  // Audio features similarity (if user has preferences)
  if (feedbackData.userPreferences?.audioFeatures && track.audioFeatures) {
    const audioPrefs = feedbackData.userPreferences.audioFeatures;
    let audioScore = 0;
    let audioReasons = [];

    // Calculate similarity to liked audio features
    ['danceability', 'energy', 'valence', 'acousticness'].forEach(feature => {
      if (audioPrefs[feature] && audioPrefs[feature].count > 0) {
        const userAvg = audioPrefs[feature].sum / audioPrefs[feature].count;
        const trackValue = track.audioFeatures[feature];
        
        if (trackValue !== undefined) {
          // Calculate similarity (closer = better)
          const similarity = 1 - Math.abs(userAvg - trackValue);
          const featureScore = similarity * 1.5; // Scale the audio feature contribution
          audioScore += featureScore;
          
          if (similarity > 0.7) {
            audioReasons.push(`Similar ${feature} to liked tracks`);
          }
        }
      }
    });

    if (audioScore > 0) {
      score += audioScore;
      reasons.push(...audioReasons);
    }
  }

  return { score, reasons };
}

export async function analyzeTracksWithAI(tracks, prompt, mood, userId = null, targetCount = 50) {
  try {
    // Fix #1: Ensure targetCount is a number
    const numericTargetCount = typeof targetCount === 'number' ? targetCount : 50;
    
    console.log(`Analyzing ${tracks.length} tracks with AI (User: ${userId || 'anonymous'}) to select ${numericTargetCount} that match the prompt`);
    
    // Fetch user feedback data if userId is provided
    let feedbackData = {
      trackFeedback: {},
      userPreferences: null,
      likedArtists: [],
      dislikedArtists: [],
      likedGenres: [],
      dislikedGenres: [],
      totalFeedbacks: 0
    };

    if (userId) {
      console.log('Fetching user feedback data...');
      feedbackData = await getUserFeedbackData(userId);
      console.log(`Found ${feedbackData.totalFeedbacks} user feedbacks`);
    }

    // Pre-filter tracks based on user feedback
    const processedTracks = tracks.map(track => {
      const preferenceData = calculateTrackPreferenceScore(track, feedbackData);
      return {
        ...track,
        userPreferenceScore: preferenceData.score,
        userPreferenceReasons: preferenceData.reasons
      };
    });

    // Remove heavily disliked tracks (score < -10) from consideration
    const candidateTracks = processedTracks.filter(track => track.userPreferenceScore > -10);
    console.log(`Filtered to ${candidateTracks.length} candidate tracks after removing heavily disliked tracks`);

    // Sort tracks by preference score (higher first) for better AI selection
    candidateTracks.sort((a, b) => b.userPreferenceScore - a.userPreferenceScore);

    // Prepare track data for AI analysis with user preference context
    const tracksData = candidateTracks.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      popularity: track.popularity,
      album: track.album?.name || 'Unknown Album',
      preview_url: track.preview_url || null,
      userPreferenceScore: track.userPreferenceScore,
      userPreferenceReasons: track.userPreferenceReasons,
      // Add audio features for AI context
      audioFeatures: track.audioFeatures ? {
        danceability: track.audioFeatures.danceability,
        energy: track.audioFeatures.energy,
        valence: track.audioFeatures.valence,
        tempo: track.audioFeatures.tempo
      } : null
    }));

    // Split tracks into chunks to avoid token limits
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < tracksData.length; i += chunkSize) {
      chunks.push(tracksData.slice(i, i + chunkSize));
    }

    let selectedTracks = [];

    for (const chunk of chunks) {
      if (selectedTracks.length >= numericTargetCount) break;

      try {
        // Prepare user preference context for AI
        const userContextInfo = userId ? {
          hasPreferences: feedbackData.totalFeedbacks > 0,
          likedArtists: feedbackData.likedArtists.slice(0, 5), // Top 5 for context
          dislikedArtists: feedbackData.dislikedArtists.slice(0, 3),
          likedGenres: feedbackData.likedGenres.slice(0, 5),
          dislikedGenres: feedbackData.dislikedGenres.slice(0, 3)
        } : { hasPreferences: false };

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `
You are a team of music curation experts: a musicologist, a lyric analyst, and a sound designer. Together, you evaluate whether tracks from a user's library match a target mood described by a prompt.

IMPORTANT: You have access to user preference data that should heavily influence your decisions:
- Tracks with positive userPreferenceScore should be STRONGLY FAVORED
- Tracks with negative userPreferenceScore should be AVOIDED unless they perfectly match the mood
- Pay attention to userPreferenceReasons which explain why tracks are preferred/not preferred
- Consider the user's liked/disliked artists and genres in your selection

Your task:
- Analyze each track using knowledge of the artist, genre, lyrics, emotional tone, AND user preferences
- Prioritize tracks that both match the mood AND align with user preferences
- For tracks with high userPreferenceScore (>5), be more lenient about perfect mood matching
- For tracks with negative userPreferenceScore, they must PERFECTLY match the mood to be included
- Balance mood matching with user preference satisfaction

Return ONLY a valid JSON object with:
- "selected": an array of track IDs (items in array:10~15 if there are more than 10 tracks) that best balance mood alignment and user preferences
- "reasons": an object where each selected track ID maps to a concise explanation including both mood fit and preference alignment

Be selective. Prioritize user satisfaction through personalized recommendations.
              `
            },
            {
              role: "user",
              content: `
User prompt: "${prompt}"
Target mood: "${mood}"

${userContextInfo.hasPreferences ? `
User preference context:
- User has provided ${feedbackData.totalFeedbacks} track feedbacks
- Liked artists: ${userContextInfo.likedArtists.join(', ') || 'None'}
- Disliked artists: ${userContextInfo.dislikedArtists.join(', ') || 'None'}  
- Liked genres: ${userContextInfo.likedGenres.join(', ') || 'None'}
- Disliked genres: ${userContextInfo.dislikedGenres.join(', ') || 'None'}
` : 'User has no preference history - focus purely on mood matching.'}

Analyze these tracks and select those that best balance mood matching with user preferences:
${JSON.stringify(chunk, null, 2)}
              `
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });

        const content = response.choices[0]?.message?.content || "";
        
        try {
          const jsonStr = content.replace(/```json|```/g, '').trim();
          const result = JSON.parse(jsonStr);
          
          if (result.selected && Array.isArray(result.selected)) {
            // Get the actual track objects for selected IDs
            const chunkSelected = chunk.filter(track => result.selected.includes(track.id));
            selectedTracks.push(...chunkSelected);
            
            console.log(`Selected ${chunkSelected.length} tracks from chunk of ${chunk.length}`);
          }
        } catch (parseError) {
          console.error('Failed to parse AI analysis result:', parseError);
        }
      } catch (error) {
        console.error('Error in AI track analysis chunk:', error);
      }
    }

    // Convert back to full track objects and maintain preference scoring
    const selectedTrackIds = new Set(selectedTracks.map(t => t.id));
    const fullSelectedTracks = candidateTracks.filter(track => selectedTrackIds.has(track.id));

    // Sort final results by a combination of user preference and AI selection order
    fullSelectedTracks.sort((a, b) => {
      // Heavily weight user preferences while maintaining some AI ordering
      const scoreA = a.userPreferenceScore * 0.7;
      const scoreB = b.userPreferenceScore * 0.7;
      return scoreB - scoreA;
    });

    console.log(`AI selected ${fullSelectedTracks.length} personalized tracks that match the prompt`);
    
    // Log some statistics for debugging
    if (userId && feedbackData.totalFeedbacks > 0) {
      const likedCount = fullSelectedTracks.filter(t => t.userPreferenceScore > 5).length;
      const neutralCount = fullSelectedTracks.filter(t => t.userPreferenceScore >= 0 && t.userPreferenceScore <= 5).length;
      const somewhatDislikedCount = fullSelectedTracks.filter(t => t.userPreferenceScore < 0).length;
      
      console.log(`Selection breakdown: ${likedCount} highly preferred, ${neutralCount} neutral, ${somewhatDislikedCount} less preferred`);
    }

    return fullSelectedTracks;

  } catch (error) {
    console.error('Error in AI track analysis:', error);
    // Fallback: if user preferences exist, prioritize liked tracks
    if (userId && feedbackData.totalFeedbacks > 0) {
      console.log('Using fallback selection based on user preferences');
      const processedTracks = tracks.map(track => {
        const preferenceData = calculateTrackPreferenceScore(track, feedbackData);
        return {
          ...track,
          userPreferenceScore: preferenceData.score
        };
      });
      
      return processedTracks
        .filter(track => track.userPreferenceScore > -10)
        .sort((a, b) => b.userPreferenceScore - a.userPreferenceScore)
        .slice(0, Math.min(numericTargetCount, processedTracks.length));
    }
    
    // Ultimate fallback: return a random selection
    const numericTargetCount = typeof targetCount === 'number' ? targetCount : 50;
    return tracks.slice(0, Math.min(numericTargetCount, tracks.length));
  }
}