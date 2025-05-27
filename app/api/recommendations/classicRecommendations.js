import { fetchFromSpotify } from './spotifyHelpers.js';

// API clients configuration
const braveApiKey = process.env.BRAVE_API_KEY;
const mistralApiKey = process.env.MISTRAL_API_KEY;

if (!braveApiKey) {
  throw new Error('BRAVE_API_KEY is missing');
}

if (!mistralApiKey) {
  throw new Error('MISTRAL_API_KEY is missing');
}

// OPTIMIZED CONFIGURATION: Reduced for speed
const SPEED_CONFIG = {
  maxCandidatesForEmbedding: 15,  // Reduced from 30
  preFilteringEnabled: true,
  embeddingModel: "mistral-embed",
  maxConcurrentRequests: 8,       // Parallel API calls
  skipSemanticSimilarity: false,  // Option to skip for extreme speed
  fastMode: true                  // Enable all speed optimizations
};

// Optimized Mistral AI client with connection pooling
async function callMistralAI(messages, temperature = 0.3, maxTokens = 1000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

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
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Mistral API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Mistral API request timeout');
    }
    console.error('Mistral AI API error:', error.message);
    throw error;
  }
}

// Batch Mistral AI embeddings for efficiency
async function getMistralEmbeddingsBatch(texts) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const response = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: Array.isArray(texts) ? texts : [texts]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Mistral Embeddings API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Mistral Embeddings API request timeout');
    }
    console.error('Mistral Embeddings API error:', error.message);
    throw error;
  }
}

// MAIN OPTIMIZED FUNCTION - PARALLEL PROCESSING
export async function generateClassicRecommendations(prompt, token) {
  try {
    console.log("=== SPEED-OPTIMIZED RECOMMENDATION WORKFLOW ===");
    console.log("Original prompt:", prompt);
    const startTime = Date.now();

    // Step 1: Quick prompt analysis (simplified)
    const analysisPromise = analyzeUserPromptFast(prompt);
    
    // Step 2 & 3: Run web search and AI generation in parallel
    const [analysisResult] = await Promise.all([analysisPromise]);
    
    console.log("Prompt analysis completed:", analysisResult);

    // Run web search and AI generation in parallel
    const [webResults, aiResults] = await Promise.all([
      searchWithBraveAPIFast(analysisResult.searchQueries),
      generateAIRecommendationsFast(analysisResult.refinedPrompt, analysisResult.constraints)
    ]);

    console.log(`Parallel processing completed: ${webResults.length} web + ${aiResults.length} AI results`);

    // Step 4: Fast alignment verification (simplified)
    const alignedSongs = await combineAndVerifyAlignmentFast(
      webResults, 
      aiResults, 
      prompt, 
      analysisResult.originalEmbedding,
      analysisResult.constraints
    );
    
    console.log(`Fast alignment completed: ${alignedSongs.length} aligned songs`);

    if (alignedSongs.length < Math.min(analysisResult.constraints.minCount, 3)) {
      throw new Error(`Not enough quality results: found ${alignedSongs.length}, need ${Math.min(analysisResult.constraints.minCount, 3)}`);
    }

    // Step 5: Parallel Spotify search with higher concurrency
    const spotifyTracks = await searchTracksOnSpotifyFast(
      alignedSongs.slice(0, Math.min(analysisResult.constraints.targetCount, 15)), 
      token
    );
    
    const endTime = Date.now();
    console.log(`SPEED-OPTIMIZED workflow completed in ${endTime - startTime}ms: ${spotifyTracks.length} tracks`);
    return spotifyTracks;

  } catch (err) {
    console.error("Speed-optimized workflow failed:", err.message);
    return [];
  }
}

// STEP 1: FAST PROMPT ANALYSIS - Simplified prompts
async function analyzeUserPromptFast(prompt) {
  try {
    const messages = [
      {
        role: "system",
        content: `Extract music request details quickly. Return JSON with:
- constraints: {targetCount, minCount, decade, specificArtist, mood}
- searchQueries: Array of 2 best search queries
- refinedPrompt: Enhanced prompt
- keywords: Array of 5 key search terms`
      },
      {
        role: "user",
        content: `Quick analysis: "${prompt}"`
      }
    ];

    // Run analysis and embedding generation in parallel
    const [analysisResponse, embeddingData] = await Promise.all([
      callMistralAI(messages, 0.3, 500), // Reduced max tokens
      getMistralEmbeddingsBatch([prompt]) // Generate embedding immediately
    ]);

    const jsonStr = analysisResponse.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(jsonStr);

    return {
      ...analysis,
      originalEmbedding: embeddingData[0].embedding,
      originalIntent: prompt,
      musicalElements: analysis.keywords || prompt.split(' ')
    };

  } catch (err) {
    console.error("Fast prompt analysis failed:", err.message);
    
    // Ultra-fast fallback
    const fallbackCount = extractNumberFromPrompt(prompt) || 10;
    return {
      constraints: { 
        targetCount: Math.min(fallbackCount, 15), 
        minCount: Math.min(fallbackCount, 3),
        decade: null,
        specificArtist: extractArtistFromPrompt(prompt),
        mood: "balanced"
      },
      searchQueries: [`${prompt} songs best`, `${prompt} music top`],
      refinedPrompt: prompt,
      keywords: prompt.split(' ').filter(w => w.length > 2).slice(0, 5),
      originalEmbedding: null
    };
  }
}

// STEP 2: PARALLEL BRAVE API SEARCH - No rate limiting
async function searchWithBraveAPIFast(searchQueries) {
  if (!braveApiKey) {
    console.warn("Brave API key not found, returning empty results");
    return [];
  }

  try {
    // Run all searches in parallel (no rate limiting for speed)
    const searchPromises = searchQueries.slice(0, 2).map(async (query) => {
      console.log(`Parallel Brave search: ${query}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      try {
        const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8`;
        
        const response = await fetch(braveUrl, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': braveApiKey
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`Brave API request failed: ${response.status}`);
          return [];
        }

        const data = await response.json();
        return extractSongsFromBraveResultsFast(data, query);
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`Brave search failed for "${query}":`, error.message);
        return [];
      }
    });

    const allResults = await Promise.all(searchPromises);
    const flatResults = allResults.flat();
    
    return removeDuplicateSongsFast(flatResults);

  } catch (err) {
    console.error("Fast Brave API search failed:", err.message);
    return [];
  }
}

// Optimized song extraction - fewer regex patterns
function extractSongsFromBraveResultsFast(data, originalQuery) {
  const songs = [];
  
  // Only process top 5 results for speed
  data.web?.results?.slice(0, 5).forEach(result => {
    const title = result.title || '';
    const description = result.description || '';
    const text = `${title} ${description}`;
    
    // Simplified patterns for speed
    const patterns = [
      /[""]([^""]+)[""] by ([^,.\n]+)/gi,
      /([^-\n]+) - ([^,.\n]+)/gi
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      matches.slice(0, 2).forEach(match => { // Max 2 per pattern
        if (match[1] && match[2] && match[1].length > 2 && match[2].length > 2) {
          songs.push({
            title: match[1].trim(),
            artist: match[2].trim(),
            source: 'brave_search',
            sourceUrl: result.url,
            reason: `Brave: "${originalQuery}"`,
            year: extractYear(text),
            genre: "Popular"
          });
        }
      });
      
      if (songs.length >= 3) break; // Limit songs per result
    }
  });

  return songs.slice(0, 8); // Max 8 songs per search query
}

// STEP 3: FAST AI GENERATION - Reduced output
async function generateAIRecommendationsFast(refinedPrompt, constraints) {
  try {
    const messages = [
      { 
        role: "system", 
        content: `Music curator. Return ${constraints.targetCount || 10} songs as JSON array. Each song: {title, artist, album, year, genre, match_reason, cultural_impact_score}. Focus on popular, well-known songs.` 
      },
      { 
        role: "user", 
        content: `Request: "${refinedPrompt}"
Target: ${constraints.targetCount || 10} songs
Artist: ${constraints.specificArtist || "any"}
Era: ${constraints.decade || "any"}

Return JSON array only, no explanation.` 
      }
    ];

    const response = await callMistralAI(messages, 0.7, 1500); // Reduced tokens
    const jsonStr = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    
    return Array.isArray(parsed) ? parsed.slice(0, constraints.targetCount || 15).map(song => ({
      ...song,
      source: 'mistral_ai_generation'
    })) : [];

  } catch (err) {
    console.error("Fast AI generation failed:", err.message);
    return [];
  }
}

// STEP 4: ULTRA-FAST ALIGNMENT - Simplified verification
async function combineAndVerifyAlignmentFast(webResults, aiResults, originalPrompt, originalEmbedding, constraints) {
  try {
    const allSongs = removeDuplicateSongsFast([...webResults, ...aiResults]);
    
    if (allSongs.length === 0) return [];

    // Fast pre-filtering with basic scoring
    let scoredSongs = allSongs.map(song => {
      let score = 0;
      
      // Quick scoring
      if (song.source === 'mistral_ai_generation') score += 5;
      else if (song.source === 'brave_search') score += 2;
      
      if (song.year && song.year >= 1950 && song.year <= 2024) score += 2;
      if (song.cultural_impact_score && song.cultural_impact_score >= 6) score += 3;
      
      // Fast keyword matching
      const searchTerms = originalPrompt.toLowerCase().split(' ').filter(term => term.length > 2);
      const songText = `${song.title} ${song.artist}`.toLowerCase();
      const keywordMatches = searchTerms.filter(term => songText.includes(term)).length;
      score += keywordMatches;
      
      // Penalties
      if (!song.title || song.title.length < 2) score -= 3;
      if (!song.artist || song.artist.length < 2) score -= 3;
      
      return { ...song, basicScore: score };
    });

    // Take top candidates quickly
    const topCandidates = scoredSongs
      .sort((a, b) => b.basicScore - a.basicScore)
      .slice(0, SPEED_CONFIG.maxCandidatesForEmbedding);
    
    console.log(`Fast pre-filtering: ${allSongs.length} -> ${topCandidates.length} candidates`);

    // Optional: Skip semantic similarity for maximum speed
    let rankedSongs = topCandidates;
    
    if (!SPEED_CONFIG.skipSemanticSimilarity && originalEmbedding && topCandidates.length > 0) {
      rankedSongs = await rankSongsBySementicSimilarityFast(topCandidates, originalEmbedding);
    }

    // Simplified AI verification - much shorter prompt
    const verificationMessages = [
      { 
        role: "system", 
        content: `Rate songs 1-10 for prompt: "${originalPrompt}". Return JSON with alignment_score added. Keep songs scoring 6+.` 
      },
      { 
        role: "user", 
        content: `Songs to rate:\n${JSON.stringify(rankedSongs.slice(0, 10), null, 1)}\n\nReturn JSON array only.`
      }
    ];

    const verificationResponse = await callMistralAI(verificationMessages, 0.1, 1500);
    const jsonStr = verificationResponse.replace(/```json|```/g, '').trim();
    const verified = JSON.parse(jsonStr);
    
    // Quick client-side filtering
    const filtered = Array.isArray(verified) ? verified.filter(song => {
      if (!song.alignment_score || song.alignment_score < 6) return false;
      
      // Fast artist check
      if (constraints.specificArtist) {
        const requestedArtist = constraints.specificArtist.toLowerCase();
        const songArtist = song.artist?.toLowerCase() || '';
        if (!songArtist.includes(requestedArtist) && !requestedArtist.includes(songArtist)) {
          return false;
        }
      }
      
      return true;
    }) : [];
    
    console.log(`Fast verification: ${rankedSongs.length} -> ${filtered.length} final songs`);
    
    return filtered.slice(0, constraints.targetCount || 12);

  } catch (err) {
    console.error("Fast alignment verification failed:", err.message);
    // Return top scored songs as fallback
    return allSongs
      .filter(song => song.title && song.artist)
      .slice(0, constraints.targetCount || 12);
  }
}

// FAST SEMANTIC SIMILARITY - Batch processing
async function rankSongsBySementicSimilarityFast(filteredSongs, originalEmbedding) {
  try {
    console.log(`Fast semantic ranking for ${filteredSongs.length} songs`);
    
    // Simplified song text for faster embedding
    const songTexts = filteredSongs.map(song => `${song.title} ${song.artist} ${song.genre || ''}`);

    // Batch embed all at once
    const embeddingData = await getMistralEmbeddingsBatch(songTexts);

    // Quick similarity calculation
    const songsWithSimilarity = filteredSongs.map((song, index) => ({
      ...song,
      similarity_score: cosineSimilarity(originalEmbedding, embeddingData[index].embedding)
    }));

    return songsWithSimilarity.sort((a, b) => b.similarity_score - a.similarity_score);

  } catch (err) {
    console.error("Fast semantic ranking failed:", err.message);
    return filteredSongs;
  }
}

// FAST SPOTIFY SEARCH - Higher concurrency
async function searchTracksOnSpotifyFast(songs, token) {
  const results = [];
  const maxConcurrent = SPEED_CONFIG.maxConcurrentRequests; // Increased from 5

  for (let i = 0; i < songs.length; i += maxConcurrent) {
    const batch = songs.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (song) => {
      try {
        // Simplified search strategy - only try 2 approaches for speed
        const searchStrategies = [
          `track:"${song.title}" artist:"${song.artist}"`,
          `${song.title} ${song.artist}`
        ];

        for (const query of searchStrategies) {
          const response = await fetchFromSpotify(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=2`, // Reduced limit
            token
          );

          const tracks = response?.tracks?.items || [];
          const bestMatch = findBestTrackMatchFast(tracks, song);
          
          if (bestMatch) {
            bestMatch.classicMetadata = {
              ...song,
              search_strategy: query
            };
            return bestMatch;
          }
        }

        return null;

      } catch (err) {
        console.error(`Fast Spotify search failed for ${song.title}:`, err.message);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(Boolean));

    // Reduced rate limiting
    await new Promise(r => setTimeout(r, 100)); // Reduced from 200ms
  }

  return results;
}

// Simplified track matching
function findBestTrackMatchFast(tracks, targetSong) {
  if (!tracks.length) return null;

  // Quick similarity check - return first decent match
  for (const track of tracks) {
    const titleSim = calculateStringSimilarityFast(track.name.toLowerCase(), targetSong.title.toLowerCase());
    const artistSim = Math.max(...track.artists.map(artist => 
      calculateStringSimilarityFast(artist.name.toLowerCase(), targetSong.artist.toLowerCase())
    ));
    
    const combinedScore = (titleSim * 0.6) + (artistSim * 0.4);
    if (combinedScore > 0.5) { // Lower threshold for speed
      return track;
    }
  }
  
  return tracks[0]; // Return first if no good match
}

// OPTIMIZED UTILITY FUNCTIONS

// Fast duplicate removal
function removeDuplicateSongsFast(songs) {
  const seen = new Set();
  return songs.filter(song => {
    const key = `${song.title?.toLowerCase().trim().slice(0, 20)}-${song.artist?.toLowerCase().trim().slice(0, 20)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Simplified string similarity (faster than Levenshtein)
function calculateStringSimilarityFast(str1, str2) {
  if (str1 === str2) return 1.0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  // Simple character overlap ratio
  const chars1 = new Set(str1.toLowerCase());
  const chars2 = new Set(str2.toLowerCase());
  const intersection = new Set([...chars1].filter(x => chars2.has(x)));
  
  return intersection.size / Math.max(chars1.size, chars2.size);
}

// Fast artist extraction from prompt
function extractArtistFromPrompt(prompt) {
  const artistPatterns = [
    /by ([A-Za-z\s]+)/i,
    /from ([A-Za-z\s]+)/i,
    /([A-Z][a-z]+\s[A-Z][a-z]+)\s+songs/i
  ];
  
  for (const pattern of artistPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1] && match[1].length > 3) {
      return match[1].trim();
    }
  }
  return null;
}

// Keep existing utility functions that are already optimized
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function extractNumberFromPrompt(prompt) {
  const match = prompt.match(/\b(\d+)\b/);
  return match ? parseInt(match[1]) : null;
}

function extractYear(text) {
  const yearMatch = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}