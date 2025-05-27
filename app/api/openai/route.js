// /api/openai.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tracks, mood, audioProfile } = req.body;

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: 'Valid tracks data is required' });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Format track data for the prompt
    const tracksFormatted = tracks.map((track, index) => {
      return `${index + 1}. "${track.name}" by ${track.artist}`;
    }).join('\n');

    // Prepare audio features summary if available
    let audioProfileSummary = '';
    if (audioProfile && typeof audioProfile === 'object') {
      const features = [];
      if (audioProfile.danceability) features.push(`danceability: ${audioProfile.danceability.toFixed(2)}`);
      if (audioProfile.energy) features.push(`energy: ${audioProfile.energy.toFixed(2)}`);
      if (audioProfile.valence) features.push(`positivity: ${audioProfile.valence.toFixed(2)}`);
      if (audioProfile.tempo) features.push(`tempo: ${Math.round(audioProfile.tempo)} BPM`);
      
      if (features.length > 0) {
        audioProfileSummary = `The overall audio profile has ${features.join(', ')}.`;
      }
    }

    // Create prompt for the story
    const storyPrompt = `
Create a short, engaging story or narrative (150-200 words) that ties together these songs into a cohesive playlist. 
The mood/theme is: "${mood}"
${audioProfileSummary}

Songs:
${tracksFormatted}

The story should capture the emotional journey or atmosphere of these songs as a collection, while being creative and evocative.
`;

    // Create prompt for insights
    const insightsPrompt = `
Based on this playlist of songs for the mood "${mood}", provide 3-4 insightful observations about the musical characteristics, patterns, or themes.

Songs:
${tracksFormatted}

${audioProfileSummary}

For example, you might comment on recurring musical elements, thematic connections between songs, how the songs complement the requested mood, or interesting contrasts within the selection.
Your insights should be thoughtful, specific to these songs, and written in 1-2 sentences each.
`;

    // Make parallel requests to OpenAI
    const [storyResponse, insightsResponse] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: "You are a creative music expert who writes engaging, evocative content about music." },
          { role: "user", content: storyPrompt }
        ],
        temperature: 0.8,
        max_tokens: 350,
      }),
      
      openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: "You are a music analyst who provides insightful, specific observations about music." },
          { role: "user", content: insightsPrompt }
        ],
        temperature: 0.7,
        max_tokens: 350,
      })
    ]);

    // Extract content from responses
    const story = storyResponse.choices[0]?.message?.content?.trim();
    
    // Process insights into an array
    const insightsText = insightsResponse.choices[0]?.message?.content?.trim();
    let insights = [];
    
    if (insightsText) {
      // Split by line breaks or numbered list items
      insights = insightsText
        .split(/\n+|\d+\.\s+/)
        .map(item => item.trim())
        .filter(item => item.length > 0 && item.length < 200); // Filter out empty items or headers
    }

    return res.status(200).json({
      story,
      insights
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ 
      error: 'Error generating content with OpenAI',
      details: error.message 
    });
  }
}