// Enhanced Audd.io API integration with parallel processing
export async function analyzeTracksWithAuddParallel(tracks) {
    try {
      console.log(`Analyzing ${tracks.length} tracks with Audd.io (parallel processing)`);
      
      const auddApiToken = process.env.AUDDIO_API_KEY || 'test';
      const maxConcurrent = 5; // Adjust based on your API rate limits
      const delayBetweenBatches = 1000; // 1 second between batches
      
      // Process tracks in parallel batches
      const results = await processTracksInParallelBatches(
        tracks, 
        auddApiToken, 
        maxConcurrent, 
        delayBetweenBatches
      );
      
      const successfulAnalyses = results.filter(r => r.features && !r.error);
      console.log(`Audd.io parallel analysis complete: ${successfulAnalyses.length}/${results.length} successful`);
      
      return results;
      
    } catch (error) {
      console.error('Error in Audd.io parallel analysis:', error);
      return tracks.map(track => ({
        track_id: track.id,
        features: generateFallbackFeatures(track),
        error: error.message
      }));
    }
  }
  
  // Process tracks in parallel batches with proper rate limiting
  async function processTracksInParallelBatches(tracks, apiToken, maxConcurrent, delayBetweenBatches) {
    const allResults = [];
    
    // Split tracks into batches
    for (let i = 0; i < tracks.length; i += maxConcurrent) {
      const batch = tracks.slice(i, i + maxConcurrent);
      console.log(`Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(tracks.length / maxConcurrent)} (${batch.length} tracks)`);
      
      // Process batch in parallel
      const batchPromises = batch.map(track => 
        analyzeTrackWithAuddioSafe(track, apiToken)
      );
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process results from Promise.allSettled
        const processedBatchResults = batchResults.map((result, index) => {
          const track = batch[index];
          
          if (result.status === 'fulfilled' && result.value) {
            return result.value;
          } else {
            // Handle failed promises
            const error = result.status === 'rejected' ? result.reason : 'Analysis failed';
            console.warn(`Failed to analyze ${track.name}: ${error.message || error}`);
            
            return {
              track_id: track.id,
              features: generateFallbackFeatures(track),
              error: error.message || error.toString()
            };
          }
        });
        
        allResults.push(...processedBatchResults);
        
        // Add delay between batches (except for the last batch)
        if (i + maxConcurrent < tracks.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
        
      } catch (error) {
        console.error('Error processing batch:', error);
        
        // Add fallback results for failed batch
        const fallbackResults = batch.map(track => ({
          track_id: track.id,
          features: generateFallbackFeatures(track),
          error: 'Batch processing failed'
        }));
        
        allResults.push(...fallbackResults);
      }
    }
    
    return allResults;
  }
  
  // Safe individual track analysis with timeout and retry
  async function analyzeTrackWithAuddioSafe(track, apiToken, retries = 2, timeout = 10000) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          analyzeTrackWithAuddioCore(track, apiToken),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
        
        if (result) {
          return result;
        }
        
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed for ${track.name}: ${error.message}`);
        
        if (attempt === retries) {
          // Final attempt failed, return fallback
          return {
            track_id: track.id,
            features: generateFallbackFeatures(track),
            error: `All ${retries + 1} attempts failed: ${error.message}`
          };
        }
        
        // Wait before retry (exponential backoff)
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  // Core Audd.io analysis function
  async function analyzeTrackWithAuddioCore(track, apiToken) {
    try {
      // Use Spotify URL instead of preview URL
      const trackUrl = `https://open.spotify.com/track/${track.id}`;
      
      const params = new URLSearchParams({
        url: trackUrl,
        return: 'apple_music,spotify,mood,genre,tempo,lyrics',
        api_token: apiToken
      });
  
      const response = await fetch(`https://api.audd.io/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MusicRecommendationApp/1.0'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
  
      const data = await response.json();
      
      if (data.status === 'success' && data.result) {
        return {
          track_id: track.id,
          features: {
            tempo: data.result.tempo || null,
            genre: data.result.genre || null,
            mood: data.result.mood || null,
            energy: data.result.energy || null,
            danceability: data.result.danceability || null,
            valence: data.result.valence || null,
            acousticness: data.result.acousticness || null,
            instrumentalness: data.result.instrumentalness || null,
            liveness: data.result.liveness || null,
            speechiness: data.result.speechiness || null
          },
          metadata: {
            ...data.result,
            analysis_source: 'audd.io',
            analysis_timestamp: new Date().toISOString()
          }
        };
      } else {
        throw new Error(data.error || 'Analysis returned no results');
      }
      
    } catch (error) {
      throw new Error(`Audd.io API error: ${error.message}`);
    }
  }
  
  // Alternative: Bulk analysis if Audd.io supports batch requests
  export async function analyzeTracksBulkWithAudd(tracks) {
    try {
      console.log(`Attempting bulk analysis of ${tracks.length} tracks with Audd.io`);
      
      const auddApiToken = process.env.AUDDIO_API_KEY || 'test';
      
      // Check if bulk analysis is supported by trying to send multiple URLs
      const trackUrls = tracks.slice(0, 10).map(track => 
        `https://open.spotify.com/track/${track.id}`
      );
      
      const bulkParams = new URLSearchParams({
        urls: trackUrls.join(','), // Try comma-separated URLs
        return: 'apple_music,spotify,mood,genre,tempo',
        api_token: auddApiToken
      });
      
      const response = await fetch(`https://api.audd.io/?${bulkParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MusicRecommendationApp/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // If bulk analysis worked, process the results
        if (data.status === 'success' && Array.isArray(data.result)) {
          console.log('Bulk analysis successful!');
          return processBulkAuddResults(tracks, data.result);
        }
      }
      
      // If bulk analysis didn't work, fall back to parallel processing
      console.log('Bulk analysis not supported, falling back to parallel processing');
      return await analyzeTracksWithAuddParallel(tracks);
      
    } catch (error) {
      console.error('Bulk analysis failed, falling back to parallel:', error);
      return await analyzeTracksWithAuddParallel(tracks);
    }
  }
  
  // Process bulk analysis results
  function processBulkAuddResults(tracks, results) {
    return tracks.map((track, index) => {
      const result = results[index];
      
      if (result && result.status === 'success' && result.result) {
        return {
          track_id: track.id,
          features: {
            tempo: result.result.tempo || null,
            genre: result.result.genre || null,
            mood: result.result.mood || null,
            energy: result.result.energy || null,
            danceability: result.result.danceability || null,
            valence: result.result.valence || null,
            acousticness: result.result.acousticness || null,
            instrumentalness: result.result.instrumentalness || null,
            liveness: result.result.liveness || null,
            speechiness: result.result.speechiness || null
          },
          metadata: {
            ...result.result,
            analysis_source: 'audd.io_bulk',
            analysis_timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          track_id: track.id,
          features: generateFallbackFeatures(track),
          error: result?.error || 'Bulk analysis failed for this track'
        };
      }
    });
  }
  
  // Enhanced fallback feature generation (keeping your existing logic but improved)
  function generateFallbackFeatures(track) {
    try {
      const popularity = track.popularity || 50;
      const genres = track.artists?.[0]?.genres || [];
      const trackName = track.name.toLowerCase();
      const artistName = track.artists?.[0]?.name.toLowerCase() || '';
      
      // Initialize base features
      let energy = 0.5;
      let valence = 0.5;
      let danceability = 0.5;
      let tempo = 120;
      let acousticness = 0.3;
      
      // Popularity-based adjustments
      energy = Math.min(0.9, 0.3 + (popularity / 100) * 0.6);
      danceability = Math.min(0.9, 0.2 + (popularity / 100) * 0.7);
      
      // Keyword analysis
      const moodKeywords = {
        happy: ['happy', 'joy', 'love', 'good', 'great', 'amazing', 'wonderful', 'sunshine', 'bright', 'dance', 'party', 'fun'],
        sad: ['sad', 'cry', 'tears', 'hurt', 'pain', 'broken', 'lonely', 'dark', 'empty', 'sorry'],
        energetic: ['power', 'strong', 'energy', 'fire', 'rock', 'wild', 'crazy', 'fast', 'run', 'jump', 'electric'],
        calm: ['calm', 'peace', 'quiet', 'soft', 'gentle', 'slow', 'meditation', 'relax']
      };
      
      // Apply keyword-based adjustments
      Object.entries(moodKeywords).forEach(([mood, keywords]) => {
        const matchCount = keywords.filter(word => 
          trackName.includes(word) || artistName.includes(word)
        ).length;
        
        if (matchCount > 0) {
          const intensity = Math.min(matchCount * 0.2, 0.4);
          
          switch (mood) {
            case 'happy':
              valence += intensity;
              energy += intensity * 0.5;
              danceability += intensity * 0.7;
              break;
            case 'sad':
              valence -= intensity;
              energy -= intensity * 0.7;
              tempo -= intensity * 40;
              acousticness += intensity * 0.5;
              break;
            case 'energetic':
              energy += intensity;
              tempo += intensity * 50;
              danceability += intensity * 0.6;
              break;
            case 'calm':
              energy -= intensity * 0.6;
              valence = 0.5; // Keep neutral
              tempo -= intensity * 30;
              acousticness += intensity * 0.4;
              break;
          }
        }
      });
      
      // Genre-based adjustments
      const genreAdjustments = {
        'dance': { energy: 0.3, danceability: 0.4, valence: 0.2, tempo: 30 },
        'pop': { energy: 0.2, danceability: 0.3, valence: 0.2, tempo: 10 },
        'rock': { energy: 0.4, tempo: 25, acousticness: -0.3 },
        'metal': { energy: 0.5, tempo: 40, acousticness: -0.4, valence: -0.2 },
        'classical': { energy: -0.2, acousticness: 0.4, tempo: -20 },
        'jazz': { acousticness: 0.3, energy: -0.1 },
        'blues': { valence: -0.2, acousticness: 0.2 },
        'electronic': { energy: 0.3, danceability: 0.4, acousticness: -0.5 },
        'ambient': { energy: -0.4, acousticness: 0.5, tempo: -30 },
        'hip-hop': { speechiness: 0.4, energy: 0.2, danceability: 0.3 },
        'country': { acousticness: 0.3, valence: 0.1 }
      };
      
      genres.forEach(genre => {
        const lowerGenre = genre.toLowerCase();
        Object.entries(genreAdjustments).forEach(([genreKey, adjustments]) => {
          if (lowerGenre.includes(genreKey)) {
            Object.entries(adjustments).forEach(([feature, adjustment]) => {
              switch (feature) {
                case 'energy':
                  energy += adjustment;
                  break;
                case 'valence':
                  valence += adjustment;
                  break;
                case 'danceability':
                  danceability += adjustment;
                  break;
                case 'tempo':
                  tempo += adjustment;
                  break;
                case 'acousticness':
                  acousticness += adjustment;
                  break;
              }
            });
          }
        });
      });
      
      // Clamp all values to valid ranges
      energy = Math.max(0.1, Math.min(0.9, energy));
      valence = Math.max(0.1, Math.min(0.9, valence));
      danceability = Math.max(0.1, Math.min(0.9, danceability));
      acousticness = Math.max(0.0, Math.min(1.0, acousticness));
      tempo = Math.max(60, Math.min(200, tempo));
      
      // Determine mood based on valence and energy
      let mood = 'neutral';
      if (valence > 0.7 && energy > 0.6) mood = 'happy';
      else if (valence > 0.6) mood = 'upbeat';
      else if (valence < 0.4 && energy < 0.5) mood = 'sad';
      else if (energy > 0.7) mood = 'energetic';
      else if (energy < 0.4) mood = 'calm';
      
      return {
        tempo: Math.round(tempo),
        energy: Math.round(energy * 100) / 100,
        valence: Math.round(valence * 100) / 100,
        danceability: Math.round(danceability * 100) / 100,
        acousticness: Math.round(acousticness * 100) / 100,
        instrumentalness: trackName.includes('instrumental') ? 0.8 : 0.1,
        liveness: 0.2,
        speechiness: (trackName.includes('rap') || trackName.includes('spoken') || genres.some(g => g.includes('hip-hop'))) ? 0.7 : 0.1,
        genre: genres.length > 0 ? genres[0] : 'pop',
        mood: mood
      };
      
    } catch (error) {
      console.error('Error generating fallback features:', error);
      return {
        tempo: 120,
        energy: 0.5,
        valence: 0.5,
        danceability: 0.5,
        acousticness: 0.3,
        instrumentalness: 0.1,
        liveness: 0.2,
        speechiness: 0.1,
        genre: 'pop',
        mood: 'neutral'
      };
    }
  }
  
  // Updated main function to use parallel processing
  export async function enhancedFeatureAnalysis(tracks, token) {
    try {
      console.log('Performing enhanced feature analysis with parallel Audd.io processing...');
      
      // First try bulk analysis, fall back to parallel if not supported
      const auddResults = await analyzeTracksBulkWithAudd(tracks);
      
      // Combine results with track data
      const combinedFeatures = tracks.map((track, index) => {
        const auddResult = auddResults.find(r => r.track_id === track.id);
        
        return {
          ...track,
          audioFeatures: auddResult?.features || generateFallbackFeatures(track),
          auddMetadata: auddResult?.metadata || null,
          analysisSource: auddResult?.features && !auddResult?.error ? 'audd.io' : 'fallback'
        };
      });
  
      const auddCount = combinedFeatures.filter(t => t.analysisSource === 'audd.io').length;
      const fallbackCount = combinedFeatures.filter(t => t.analysisSource === 'fallback').length;
      
      console.log(`Enhanced parallel analysis complete: ${auddCount} from Audd.io, ${fallbackCount} from fallback`);
      return combinedFeatures;
      
    } catch (error) {
      console.error('Error in enhanced feature analysis:', error);
      return tracks.map(track => ({
        ...track,
        audioFeatures: generateFallbackFeatures(track),
        auddMetadata: null,
        analysisSource: 'fallback'
      }));
    }
  }