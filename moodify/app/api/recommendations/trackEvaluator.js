import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function evaluateTrackAlignment(tracks, prompt, mood) {
  try {
    console.log(`Evaluating ${tracks.length} tracks for alignment with prompt and mood`);
    
    // Prepare track data with features for evaluation
    const tracksData = tracks.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      popularity: track.popularity,
      album: track.album?.name || 'Unknown Album',
      audioFeatures: track.audioFeatures || null,
      auddMetadata: track.auddMetadata || null
    }));

    // Split tracks into chunks for processing
    const chunkSize = tracks.length > 30 ? 10 : 15;
    const chunks = [];
    for (let i = 0; i < tracksData.length; i += chunkSize) {
      chunks.push(tracksData.slice(i, i + chunkSize));
    }

    let allEvaluations = [];

    const evaluations = await Promise.allSettled(
      chunks.map(async (chunk) => {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "system",
                content: `
          You are a music expert evaluating how well a set of songs matches a user's intended mood, based on title, artist, and musical/lyrical qualities.
          
          Instructions:
          1. For each track, assess its alignment with the user’s described mood and prompt.
          2. Consider:
             - Known genre or artist style
             - Audio features (if available): tempo, energy, valence, danceability
             - Lyrical themes or vibe (if known)
             - General emotional tone and instrumentation
          3. Use a **1–10 scale** for alignment (10 = perfect fit, 7+ = reasonable match).
          
          Be generous: a score of 7+ means the song has any meaningful connection to the user's mood, even if indirect. For example:
          - Happy moods → upbeat pop, dance, funk, sunshine indie, warm acoustic rock
          - Chill moods → lo-fi, soft jazz, ambient, mellow R&B
          - Sad moods → slow ballads, introspective lyrics, low valence tracks
          
          Return only a JSON object with:
          {
            "evaluations": [
              { "id": "track_id", "score": 8, "reason": "brief reason for fit (mention genre, lyrics, or vibe)" },
              ...
            ]
          }
          `
              },
              {
                role: "user",
                content: `User prompt: "${prompt}"
          Target mood: "${mood}"
          
          Evaluate these tracks generously based on alignment:
          ${JSON.stringify(chunk, null, 2)}`
              }
            ],
            temperature: 0.2,
          });

          const content = response.choices[0]?.message?.content || "";
          const jsonStr = content.replace(/```json|```/g, '').trim();
          const result = JSON.parse(jsonStr);
    
          return result.evaluations || [];        
      } catch (error) {
        console.error("Chunk evaluation error:", error);
        // fallback scores if error occurs
        return chunk.map(track => ({
          id: track.id,
          score: 6,
          reason: 'Fallback scoring due to error'
        }));
      }
    })
  );

  
    // Filter tracks based on scores - be more lenient with threshold
    const highQualityTracks = [];
    const lowQualityTracks = [];

    const flattenedEvaluations = evaluations.flatMap(res =>
      res.status === 'fulfilled' ? res.value : []
    );
    
    
    for (const track of tracks) {
      
      const evaluation = flattenedEvaluations.find(e => e.id === track.id);
      const score = evaluation?.score || 6; // Default to decent score instead of 5
      
      if (score >= 6) { // Lowered threshold from 7 to 6
        highQualityTracks.push({
          ...track,
          alignmentScore: score,
          alignmentReason: evaluation?.reason || 'Good match'
        });
      } else {
        lowQualityTracks.push({
          ...track,
          alignmentScore: score,
          alignmentReason: evaluation?.reason || 'Poor match'
        });
      }
    }

    console.log(`Track evaluation complete: ${highQualityTracks.length} high-quality, ${lowQualityTracks.length} low-quality`);
    
    return {
      highQualityTracks,
      lowQualityTracks,
      allEvaluations
    };

  } catch (error) {
    console.error('Error evaluating track alignment:', error);
    
    // Complete fallback: treat all tracks as decent quality
    const fallbackTracks = tracks.map(track => ({
      ...track,
      alignmentScore: 6,
      alignmentReason: 'Fallback due to evaluation error'
    }));
    
    return {
      highQualityTracks: fallbackTracks,
      lowQualityTracks: [],
      allEvaluations: []
    };
  }
}

// Function to get top artists for fallback recommendations
export async function getUserTopArtists(token, limit = 5) {
  try {
    console.log(`Fetching user's top ${limit} artists`);
    
    const response = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.items || [];
    } else {
      console.warn('Error fetching top artists:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error getting user top artists:', error);
    return [];
  }
}

// Function to get artist's popular tracks
export async function getArtistTracks(artistId, token, limit = 5) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return (data.tracks || []).slice(0, limit);
    } else {
      console.warn(`Error fetching tracks for artist ${artistId}:`, response.status);
      return [];
    }
  } catch (error) {
    console.error(`Error getting artist tracks for ${artistId}:`, error);
    return [];
  }
}