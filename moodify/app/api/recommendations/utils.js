// Fisher-Yates shuffle algorithm
export function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  // Generate story/description for playlist
  export async function generatePlaylistStory(tracks, prompt, mood, customStory = '', recommendationType = 'mood', outputFormat = 'playlist') {
    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
  
      // Get song names and artists for context
      const tracksInfo = tracks.map(track => ({
        name: track.name,
        artists: track.artists.map(artist => artist.name).join(', ')
      }));
  
      // Prepare prompt for OpenAI based on recommendation type and output format
      let aiPrompt = "";
      
      if (customStory) {
        aiPrompt = `The user has requested a custom theme: "${customStory}". Write a vivid, emotional paragraph that connects these songs into a cohesive playlist narrative. Use warm, descriptive language.`;
      } else if (recommendationType === "classic") {
        aiPrompt = `Write a short but emotionally rich paragraph explaining how this set of classic songs captures the theme: "${prompt}". Mention musical eras, iconic artists, or historical relevance where possible.`;
      } else if (outputFormat === "track") {
        aiPrompt = `Write a short, personal paragraph explaining why this single song fits the user's mood: "${prompt}". Reflect on lyrics, emotional tone, or vibe that makes it stand out.`;
      } else {
        aiPrompt = `Write a personal and concise paragraph about how this playlist aligns with the user's mood: "${prompt}". Mention emotional connections, genres, or lyrical themes where relevant.`;
      }
      
      // Add shared ending (prompt engineering power tip)
      aiPrompt += ` 
      Here are the songs: ${JSON.stringify(tracksInfo)}.
      Use a warm, creative tone. Make it feel like a human recommendation. Avoid generic language like "great songs" or "you'll love it." Focus on connection, mood, and storytelling. Keep it under 150 words.`;
  
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a music expert who writes creative, evocative descriptions of playlists." },
          { role: "user", content: aiPrompt }
        ],
        max_tokens: 250
      });
  
      return aiResponse.choices[0]?.message?.content || "";
    } catch (aiError) {
      console.error('Error generating story with AI:', aiError);
      // Fallback to simple story if AI fails
      if (outputFormat === "track") {
        return `A song curated for your "${prompt}" mood.`;
      } else {
        return `A playlist curated for your "${prompt}" mood.`;
      }
    }
  }
  
  // Create simplified audio features for frontend
  export function createAudioFeatures(mood) {
    const moodToFeatures = {
      'energetic': { energy: 0.8, valence: 0.6, danceability: 0.7 },
      'calm': { energy: 0.3, valence: 0.5, danceability: 0.3 },
      'melancholy': { energy: 0.4, valence: 0.2, danceability: 0.3 },
      'upbeat': { energy: 0.7, valence: 0.8, danceability: 0.7 },
      'sad': { energy: 0.3, valence: 0.2, danceability: 0.3 },
      'happy': { energy: 0.6, valence: 0.8, danceability: 0.6 },
      'focused': { energy: 0.5, valence: 0.4, danceability: 0.3 },
      'relaxed': { energy: 0.3, valence: 0.5, danceability: 0.4 },
      'party': { energy: 0.9, valence: 0.8, danceability: 0.9 },
      'romantic': { energy: 0.4, valence: 0.6, danceability: 0.5 },
      'balanced': { energy: 0.5, valence: 0.5, danceability: 0.5 }
    };
  
    return moodToFeatures[mood.toLowerCase()] || moodToFeatures['balanced'];
  }
  
  // Validate request parameters
  export function validateRequestParams(body) {
    const {
      prompt,
      token,
      createPlaylistFlag = false,
      manualTracks = [],
      recommendationType = "mood",
      outputFormat = "track"
    } = body;
  
    const errors = [];
  
    if (!token) {
      errors.push('Spotify access token is required');
    }
  
    if (createPlaylistFlag) {
      if (!manualTracks || manualTracks.length === 0) {
        errors.push('Manual tracks are required for playlist creation');
      }
    } else {
      if (!prompt) {
        errors.push('Prompt is required for recommendations');
      }
    }
  
    if (!['mood', 'classic'].includes(recommendationType)) {
      errors.push('Invalid recommendation type. Must be "mood" or "classic"');
    }
  
    if (!['track', 'playlist'].includes(outputFormat)) {
      errors.push('Invalid output format. Must be "track" or "playlist"');
    }
  
    return {
      isValid: errors.length === 0,
      errors
    };
  }