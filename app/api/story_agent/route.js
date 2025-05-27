import { DynamicTool } from '@langchain/core/tools';

// 環境變數
const fastApiUrl = process.env.FASTAPI_URL || 'http://54.152.238.168:8000';

// Generate story using FastAPI
async function generateStoryWithFastAPI(lyrics, artist, song, customStory = null) {
  try {
    console.log('Generating story with FastAPI...');
    
    const requestBody = {
      lyrics: lyrics
    };
    
    // Add custom story if provided
    if (customStory) {
      requestBody.custom_story = customStory;
      console.log(`Including custom story elements: ${customStory}`);
    }
    
    const response = await fetch(`${fastApiUrl}/generate-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`FastAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if there's an error in the response
    if (data.error) {
      throw new Error(`FastAPI error: ${data.error}`);
    }
    
    console.log('Story generation completed via FastAPI');
    
    return {
      story: data.story,
      lyrics_analysis: data.lyrics_analysis,
      custom_story: data.custom_story,
      artist: artist,
      song: song,
      embedding_dimensions: data.embedding_dimensions,
      generated_by: 'FastAPI'
    };
    
  } catch (error) {
    console.error('FastAPI story generation error:', error.message);
    throw error;
  }
}

// POST API Handler for generating story
export async function POST(req) {
  try {
    const { lyrics, artist, song, customStory } = await req.json();
    
    if (!lyrics || !artist || !song) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: '必須提供 lyrics, artist 和 song 參數' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`\n=== Story Generation Request ===`);
    console.log(`Artist: ${artist}`);
    console.log(`Song: ${song}`);
    console.log(`Lyrics length: ${lyrics.length} chars`);
    if (customStory) console.log(`Custom Story: ${customStory}`);
    console.log(`FastAPI URL: ${fastApiUrl}`);
    console.log(`================================\n`);

    // Generate story using FastAPI
    const storyData = await generateStoryWithFastAPI(lyrics, artist, song, customStory);
    
    return new Response(
      JSON.stringify({
        success: true,
        ...storyData,
        generated_at: new Date().toISOString(),
        process_info: {
          step: 'FastAPI故事生成 ✓'
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Story Generation API Error:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `故事生成錯誤: ${error.message}`,
        step_failed: '請檢查FastAPI服務和網路連接',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}