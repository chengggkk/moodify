import { NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      topTracks = [],
      recommendedTracks = [],
      audioFeatures = {},
      mood = "balanced"
    } = body;
    
    // Validate required data
    if (!recommendedTracks || recommendedTracks.length === 0) {
      return NextResponse.json({ error: 'Recommended tracks are required' }, { status: 400 });
    }

    // Prepare data for AI analysis
    const trackDetails = recommendedTracks.map(track => ({
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      album: track.album ? {
        name: track.album.name,
        releaseDate: track.album.release_date
      } : null
    }));
    
    // Format user's top tracks for context
    const userTopTracks = topTracks.slice(0, 5).map(track => ({
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', ')
    }));
    
    // Create enhanced story with more personal context
    let enhancedStory = '';
    let insightfulComments = [];
    
    try {
      const storyResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a music expert and personal music advisor who creates personalized playlists. 
            Write an engaging, personal paragraph about how a set of songs connects to a specific mood.
            Keep the tone warm, personalized, and enthusiastic. Be creative and insightful.`
          },
          {
            role: "user",
            content: `Generate a personalized paragraph about how these recommended songs match the mood: "${prompt}".
            
            The recommended songs are: ${JSON.stringify(trackDetails)}.
            
            For context, the user typically listens to: ${JSON.stringify(userTopTracks)}.
            
            The mood can be described as: "${mood}".`
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      });
      
      enhancedStory = storyResponse.choices[0]?.message?.content || "";
      
      // Now generate insights about the playlist
      const insightsResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a music expert who provides insightful observations about music. 
            Generate 3-4 interesting insights about a playlist based on artist connections, 
            music theory, genre relationships, or historical context. Be specific and informative.`
          },
          {
            role: "user",
            content: `Generate 3-4 insightful comments about this playlist with the mood: "${prompt}".
            
            The playlist tracks are: ${JSON.stringify(trackDetails)}.
            
            For context, the user typically listens to: ${JSON.stringify(userTopTracks)}.
            
            The mood can be described as: "${mood}".
            
            Format your response as a JSON array of strings, with each string being one insightful comment.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });
      
      try {
        // Try to parse the response as JSON first
        const content = insightsResponse.choices[0]?.message?.content || "";
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          insightfulComments = JSON.parse(jsonMatch[0]);
        } else {
          // If not valid JSON, split by newlines or periods
          insightfulComments = content
            .split(/\n|\./)
            .map(line => line.trim())
            .filter(line => line.length > 15)
            .slice(0, 4);
        }
      } catch (parseError) {
        console.error("Error parsing insights:", parseError);
        // Split by newlines as a fallback
        insightfulComments = insightsResponse.choices[0]?.message?.content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 15 && !line.startsWith('[') && !line.startsWith(']'))
          .slice(0, 4);
      }
      
    } catch (aiError) {
      console.error('Error generating AI content:', aiError);
      // Provide fallback story
      enhancedStory = `A personalized selection of tracks that match your "${prompt}" mood.`;
      insightfulComments = [
        `This playlist features music that captures the essence of ${mood}.`,
        `The tracks were selected to match your personal music preferences.`
      ];
    }

    // Return the enhanced story and insights
    return NextResponse.json({
      story: enhancedStory,
      insightfulComments: insightfulComments
    });
    
  } catch (error) {
    console.error('AI recommendations API error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate AI recommendations'
    }, { status: 500 });
  }
}