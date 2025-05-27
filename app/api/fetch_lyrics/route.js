import { DynamicTool } from '@langchain/core/tools';

// 環境變數
const braveApiKey = process.env.BRAVE_API_KEY;
const mistralApiKey = process.env.MISTRAL_API_KEY;

if (!braveApiKey) {
  throw new Error('BRAVE_API_KEY is missing');
}

if (!mistralApiKey) {
  throw new Error('MISTRAL_API_KEY is missing');
}

// Mistral AI client for evaluation and formatting
async function callMistralAI(messages, temperature = 0.3) {
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: messages,
        temperature: temperature,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Mistral AI API error:', error.message);
    throw error;
  }
}

// Evaluate top 5 search results using Mistral AI
async function evaluateSearchResultsWithMistral(results, artist, song) {
  try {
    console.log('Evaluating top 5 search results with Mistral AI...');
    
    // Prepare the top 5 results for evaluation
    const top5Results = results.slice(0, 5).map((result, index) => ({
      index: index + 1,
      title: result.title || 'No title',
      url: result.url || 'No URL',
      description: result.description || 'No description'
    }));

    const evaluationPrompt = [
      {
        role: 'system',
        content: `You are an expert at evaluating search results for song lyrics. Your task is to analyze search results and determine which ones are most likely to contain accurate, complete lyrics for the requested song.

Evaluation criteria:
1. URL credibility (lyrics sites like Genius, AZLyrics, Lyrics.com are preferred)
2. Title relevance (should contain both artist and song name)
3. Description quality (should indicate lyrics content)
4. Overall trustworthiness

Return your evaluation as a JSON array with rankings from best to worst, including reasoning for each choice.`
      },
      {
        role: 'user',
        content: `Please evaluate these search results for lyrics of "${song}" by "${artist}":

${JSON.stringify(top5Results, null, 2)}

Return a JSON response with the following structure:
{
  "rankings": [
    {
      "original_index": 1,
      "score": 95,
      "reasoning": "High-quality lyrics site with exact match"
    }
  ],
  "best_choice": {
    "original_index": 1,
    "confidence": "high"
  }
}`
      }
    ];

    const evaluation = await callMistralAI(evaluationPrompt);
    
    try {
      const parsedEvaluation = JSON.parse(evaluation);
      console.log('Mistral AI evaluation completed');
      return parsedEvaluation;
    } catch (parseError) {
      console.error('Failed to parse Mistral evaluation response:', parseError.message);
      // Fallback to original order if parsing fails
      return {
        rankings: top5Results.map((result, index) => ({
          original_index: result.index,
          score: 100 - (index * 10),
          reasoning: "Fallback ranking"
        })),
        best_choice: { original_index: 1, confidence: "low" }
      };
    }
  } catch (error) {
    console.error('Mistral AI evaluation error:', error.message);
    // Return fallback evaluation
    return {
      rankings: results.slice(0, 5).map((result, index) => ({
        original_index: index + 1,
        score: 100 - (index * 10),
        reasoning: "Fallback due to evaluation error"
      })),
      best_choice: { original_index: 1, confidence: "low" }
    };
  }
}

// Format lyrics using Mistral AI
async function formatLyricsWithMistral(rawLyrics, artist, song) {
  try {
    console.log('Formatting lyrics with Mistral AI...');
    
    const formattingPrompt = [
      {
        role: 'system',
        content: `You are an expert at formatting song lyrics. Your task is to clean up and properly format raw lyrics text that may contain HTML, metadata, and other unwanted elements.

Instructions:
- Remove all HTML tags, metadata, website elements, and navigation text
- Remove section labels like [Verse], [Chorus], [Bridge], etc.
- Remove website names, copyright notices, and advertisements
- Clean up spacing and line breaks for proper readability
- Preserve the natural flow and structure of the lyrics
- DO NOT use markdown formatting - return plain text only
- DO NOT add any section headers or labels
- Ensure proper capitalization and punctuation
- Remove duplicate lines while preserving intentional repetition (like choruses)

Return ONLY the cleaned lyrics text without any additional commentary or formatting.`
      },
      {
        role: 'user',
        content: `Please format these raw lyrics for "${song}" by "${artist}":

${rawLyrics}

Return only the cleaned lyrics text without any markdown or additional formatting.`
      }
    ];

    const formattedLyrics = await callMistralAI(formattingPrompt, 0.1);
    console.log('Mistral AI formatting completed');
    return formattedLyrics.trim();
  } catch (error) {
    console.error('Mistral AI formatting error:', error.message);
    // Fallback to basic cleaning if Mistral fails
    return cleanLyrics(rawLyrics);
  }
}

// Fetch lyrics using Brave Search API with Mistral AI evaluation
async function fetchLyricsWithBraveAPI(artist, song) {
  try {
    console.log(`Fetching lyrics via Brave Search API: ${artist} - ${song}`);
    
    // Search for lyrics using Brave Search API
    const searchQuery = `${artist} ${song} lyrics`;
    const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(braveUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': braveApiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Brave Search API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Brave Search API search completed');
    
    if (!data.web || !data.web.results || data.web.results.length === 0) {
      throw new Error('No search results found');
    }

    // Use Mistral AI to evaluate the top 5 results
    const evaluation = await evaluateSearchResultsWithMistral(data.web.results, artist, song);
    
    // Try to fetch lyrics from URLs in the order recommended by Mistral AI
    let lyricsContent = null;
    const rankedResults = evaluation.rankings.sort((a, b) => b.score - a.score);
    
    for (const ranking of rankedResults) {
      const resultIndex = ranking.original_index - 1;
      const result = data.web.results[resultIndex];
      
      if (!result || !result.url) continue;
      
      // Check if it's a lyrics site
      if (result.url.includes('genius.com') ||
          result.url.includes('azlyrics.com') ||
          result.url.includes('lyrics.com') ||
          result.url.includes('metrolyrics.com') ||
          result.url.includes('lyricfind.com')) {
        
        try {
          console.log(`Trying to fetch from ranked result #${ranking.original_index}: ${result.url}`);
          lyricsContent = await fetchLyricsFromUrl(result.url);
          if (lyricsContent && lyricsContent.length > 100) {
            console.log(`Successfully fetched lyrics from ranked result (score: ${ranking.score})`);
            break;
          }
        } catch (error) {
          console.log(`Failed to fetch from ${result.url}: ${error.message}`);
          continue;
        }
      }
    }
    
    // Fallback: Check featured snippet if no URL worked
    if (!lyricsContent) {
      for (const result of data.web.results.slice(0, 5)) {
        if (result.description && result.description.length > 200) {
          // Check if description contains lyrics-like content
          if (result.description.includes('lyrics') || 
              result.description.includes('verse') || 
              result.description.includes('chorus')) {
            lyricsContent = result.description;
            console.log('Found potential lyrics in search result description');
            break;
          }
        }
      }
    }
    
    return lyricsContent;
  } catch (error) {
    console.error('Brave Search API lyrics fetch error:', error.message);
    return null;
  }
}

// Helper function to fetch lyrics from a specific URL
async function fetchLyricsFromUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Simple text extraction - look for common patterns
    let lyrics = '';
    
    if (url.includes('genius.com')) {
      // Extract text between common genius patterns
      const lyricsMatch = html.match(/<div[^>]*data-lyrics-container[^>]*>([\s\S]*?)<\/div>/gi);
      if (lyricsMatch) {
        lyrics = lyricsMatch.map(match => 
          match.replace(/<[^>]*>/g, '').trim()
        ).join('\n');
      }
    } else if (url.includes('azlyrics.com')) {
      // Extract from azlyrics pattern
      const lyricsMatch = html.match(/<!-- Usage of azlyrics\.com content[\s\S]*?-->([\s\S]*?)<!-- MxM banner -->/);
      if (lyricsMatch) {
        lyrics = lyricsMatch[1].replace(/<[^>]*>/g, '').trim();
      }
    } else {
      // Generic extraction - look for large text blocks
      const textBlocks = html.match(/<div[^>]*>([\s\S]*?)<\/div>/gi);
      if (textBlocks) {
        const candidates = textBlocks
          .map(block => block.replace(/<[^>]*>/g, '').trim())
          .filter(text => text.length > 200 && text.includes('\n'))
          .sort((a, b) => b.length - a.length);
        
        if (candidates.length > 0) {
          lyrics = candidates[0];
        }
      }
    }
    
    return lyrics && lyrics.length > 50 ? lyrics : null;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error.message);
    return null;
  }
}

// Clean lyrics (fallback function)
function cleanLyrics(rawLyrics) {
  try {
    console.log('Using fallback lyrics cleaning...');
    
    let cleaned = rawLyrics
      // Decode HTML entities first
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([a-fA-F0-9]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
      
      // Remove website metadata and navigation
      .replace(/\d+\s*Contributors?/gi, '')
      .replace(/Translations?/gi, '')
      .replace(/Share/gi, '')
      .replace(/Embed/gi, '')
      .replace(/See.*?Translations?/gi, '')
      .replace(/\d+\s*Embed/gi, '')
      
      // Remove common lyrics site elements
      .replace(/\[Verse\s*\d*\]/gi, '')
      .replace(/\[Chorus\]/gi, '')
      .replace(/\[Bridge\]/gi, '')
      .replace(/\[Outro\]/gi, '')
      .replace(/\[Intro\]/gi, '')
      .replace(/\[Hook\]/gi, '')
      .replace(/\[Refrain\]/gi, '')
      .replace(/\[Pre-Chorus\]/gi, '')
      .replace(/\[.*?\]/g, '') // Remove any remaining bracketed sections
      .replace(/\(.*?x\d+.*?\)/gi, '') // Remove repetition markers like (x2)
      .replace(/\(Repeat.*?\)/gi, '')
      
      // Remove website names and metadata
      .replace(/genius\.com|azlyrics\.com|lyrics\.com|metrolyrics\.com/gi, '')
      .replace(/lyrics/gi, '')
      .replace(/copyright|©|\u00A9/gi, '')
      .replace(/all rights reserved/gi, '')
      .replace(/powered by/gi, '')
      
      // Clean up spacing and formatting
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
      .replace(/\s{2,}/g, ' ') // Max 1 consecutive space
      .replace(/^\s+|\s+$/gm, '') // Trim each line
      .trim();
    
    console.log(`Fallback lyrics cleaned: ${rawLyrics.length} -> ${cleaned.length} chars`);
    return cleaned;
  } catch (error) {
    console.error('Lyrics cleaning error:', error.message);
    return rawLyrics; // Return original if cleaning fails
  }
}

// POST API Handler for fetching lyrics
export async function POST(req) {
  try {
    const { artist, song } = await req.json();
    
    if (!artist || !song) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: '必須提供 artist 和 song 參數' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`\n=== Enhanced Lyrics Fetch Request ===`);
    console.log(`Artist: ${artist}`);
    console.log(`Song: ${song}`);
    console.log(`Using Mistral AI for evaluation and formatting`);
    console.log(`=====================================\n`);

    // Fetch lyrics using Brave Search API with Mistral AI evaluation
    const rawLyrics = await fetchLyricsWithBraveAPI(artist, song);
    
    if (!rawLyrics || rawLyrics.length < 50) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `無法通過Brave Search API獲取《${song}》的歌詞，請檢查歌曲名稱或稍後再試`,
          suggestion: '請確認歌手和歌曲名稱的正確性'
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Raw lyrics fetched (${rawLyrics.length} chars)`);

    // Format lyrics using Mistral AI
    const formattedLyrics = await formatLyricsWithMistral(rawLyrics, artist, song);
    console.log('Lyrics formatted with Mistral AI');

    return new Response(
      JSON.stringify({ 
        success: true,
        lyrics: formattedLyrics,
        artist: artist,
        song: song,
        lyrics_length: formattedLyrics.length,
        processing_method: 'mistral_ai_enhanced',
        fetched_at: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Enhanced Lyrics API Error:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `歌詞獲取錯誤: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}