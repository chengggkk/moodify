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
            content:`
You are a team of expert music curators: a lyrics analyst, a sound designer, and a cultural historian. Together, you create emotionally resonant, personalized music stories. Your tone is warm, thoughtful, and poetic.

Your job is to write a long, emotionally rich paragraph (250+ words) that explains why a given set of songs matches a user's current mood.

Start by identifying the emotional tone of the mood. Then explain — step by step — how each song's lyrics, sound, or story aligns with that emotion. Verify that your story aligns with the user's listening habits.

Reflect the user's mood and connect it to song elements like tempo, key, themes, or instrumentation. Use vivid metaphors and emotionally descriptive language. The goal is for the user to feel deeply seen.

Example:
"When you're feeling nostalgic, songs like Fleetwood Mac’s 'Landslide' gently echo memories of the past..."

Output only the story paragraph, no extra formatting or lists.
      `
          },
          {
            role: "user",
            content: `Generate a personalized paragraph about how these recommended songs match the mood: "${prompt}".

The recommended songs are: ${JSON.stringify(trackDetails)}.

The user typically listens to: ${JSON.stringify(userTopTracks)}.

The mood can be described as: "${mood}".

Make the story poetic, personal, emotionally intelligent, and deeply tied to the music’s essence.`
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
            content: `
You are a group of music analysts: a musicologist, a producer, and a cultural historian. Together, you extract insightful and emotionally relevant patterns from playlists. 

Your job is to provide 4 detailed, interesting observations about a playlist based on:
- artist connections or collaborations
- shared musical theory elements (e.g. mode, tempo, harmony)
- historical or genre evolution context
- alignment with user's past listening patterns or emotional context

Each comment should reflect deep understanding and connect the playlist to the user's emotional and musical preferences.

Each insight should:
- reference specific tracks or artists
- include musical terminology when appropriate
- relate to the mood or emotional tone
- highlight unexpected or subtle connections

Output a JSON array of 4 strings. Each string should be one insightful comment.
  `
          },
          {
            role: "user",
            content:`
Generate 4 insightful comments about this playlist with the mood: "${prompt}".

The playlist tracks are: ${JSON.stringify(trackDetails)}.

For context, the user typically listens to: ${JSON.stringify(userTopTracks)}.

The mood can be described as: "${mood}".

Output only a JSON array of 4 strings, each being one rich insight.
      `
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