import { NextResponse } from 'next/server';

// Import all modules (fix relative paths)
import { analyzeMood } from './analyzeMood.js';
import { fetchLibrary } from './fetchLibrary.js';
import { analyzeTracksWithAI } from './aiTrackAnalyzer.js';
import { enhancedFeatureAnalysis } from './auddAnalyzer.js';
import { evaluateTrackAlignment } from './trackEvaluator.js';
import { generateFallbackRecommendations } from './fallbackRecommendations.js';
import { generateClassicRecommendations } from './classicRecommendations.js';
import { createSpotifyPlaylist } from './spotifyHelpers.js';
import {
  validateRequestParams,
  generatePlaylistStory,
  createAudioFeatures
} from './utils.js';

// Import progress tracker
import { ProgressTracker } from '../../lib/progressStore.js';

export async function POST(request) {
  let progressTracker = null;
  
  try {
    const body = await request.json();

    // Validate request parameters
    const validation = validateRequestParams(body);
    if (!validation.isValid) {
      return NextResponse.json({
        error: validation.errors.join(', ')
      }, { status: 400 });
    }

    const {
      prompt,
      token,
      seedTracks = [],
      customStory = "",
      createPlaylistFlag = false,
      playlistName = "",
      manualTracks = [],
      recommendationType = "mood",
      outputFormat = "track",
      qualityCheck = true,
      requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    } = body;

    // Initialize progress tracker FIRST
    progressTracker = new ProgressTracker(requestId);
    console.log('ProgressTracker created successfully');

    await new Promise(resolve => setTimeout(resolve, 100));


    // Add this function to get userId from token
    async function getUserIdFromToken(token) {
      try {
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const userData = await response.json();
          return userData.id;
        }
      } catch (error) {
        console.error('Failed to get user ID from token:', error);
      }

      return null;
    }

    const userId = token ? await getUserIdFromToken(token) : null;

    console.log("=== MUSIC RECOMMENDATION API REQUEST ===");
    console.log(`Type: ${recommendationType}, Format: ${outputFormat}, Prompt: "${prompt}"`);

    // Handle playlist creation if that's what we're doing
    if (createPlaylistFlag && manualTracks && manualTracks.length > 0) {
      await progressTracker.updateStep('playlist_creation', 'active', 'Creating playlist...');
      
      try {
        const playlist = await createSpotifyPlaylist(token, playlistName, manualTracks, customStory);
        await progressTracker.completeStep('playlist_creation', 'Playlist created successfully');
        await progressTracker.complete(playlist);
        
        return NextResponse.json({
          requestId,
          playlist: playlist,
          message: 'Playlist created successfully',
          recommendationType: 'mood',
          outputFormat: 'playlist'
        });
      } catch (error) {
        await progressTracker.setError('playlist_creation', error.message);
        return NextResponse.json({
          error: error.message || 'Failed to create playlist'
        }, { status: 500 });
      }
    }

    let recommendations = [];
    let mood = "balanced";
    let processingMetadata = {};

    // WORKFLOW BRANCHES
    if (recommendationType === "mood") {
      const result = await processMoodRecommendationsOptimized(prompt, token, outputFormat, qualityCheck, userId, progressTracker);
      recommendations = result.recommendations;
      mood = result.mood;
      processingMetadata = result.metadata;
    } else if (recommendationType === "classic") {
      const result = await processClassicRecommendations(prompt, token, outputFormat, progressTracker);
      recommendations = result.recommendations;
      processingMetadata = result.metadata;
    }

    // Validate we have recommendations
    if (!recommendations || recommendations.length === 0) {
      await progressTracker.setError('final_validation', 'Could not generate recommendations with the provided parameters');
      return NextResponse.json({
        error: 'Could not generate recommendations with the provided parameters',
        metadata: processingMetadata
      }, { status: 404 });
    }

    await progressTracker.updateStep('story_generation', 'active', 'Generating playlist story...');

    // Generate story and audio features
    const story = await generatePlaylistStory(
      recommendations,
      prompt,
      mood,
      customStory,
      recommendationType,
      outputFormat
    );

    const audioFeatures = createAudioFeatures(mood);

    await progressTracker.completeStep('story_generation', 'Story generated');

    console.log(`=== REQUEST COMPLETED: ${recommendations.length} recommendations generated ===`);

    // Mark as complete
    await progressTracker.complete({
      recommendations: recommendations.length,
      mood,
      story: story ? 'Generated' : 'None'
    });

    // Return final response
    return NextResponse.json({
      requestId,
      recommendations: recommendations,
      audioFeatures: audioFeatures,
      mood: mood,
      story: story,
      recommendationType: recommendationType,
      outputFormat: outputFormat,
      processingMetadata: processingMetadata
    });

  } catch (error) {
    console.error('API error:', error);
    if (progressTracker) {
      await progressTracker.setError('api_error', error.message);
    }
    
    return NextResponse.json({
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// OPTIMIZED MOOD RECOMMENDATION WORKFLOW WITH PROGRESS TRACKING
async function processMoodRecommendationsOptimized(prompt, token, outputFormat, qualityCheck, userId, progressTracker) {
  const metadata = {
    workflow: "mood_optimized",
    steps: [],
    timing: { start: Date.now() }
  };

  try {
    console.log("=== STARTING OPTIMIZED MOOD RECOMMENDATION WORKFLOW ===");

    // Step 1: Analyze user's mood with enhanced prompting
    await progressTracker.updateStep('mood_analysis', 'active', 'Analyzing your mood...');
    console.log("Step 1: Enhanced mood analysis...");
    const stepStart = Date.now();
    const mood = await analyzeMood(prompt);
    const moodDuration = Date.now() - stepStart;
    
    metadata.steps.push({
      step: 1,
      name: "mood_analysis",
      result: mood,
      duration: moodDuration
    });
    
    await progressTracker.completeStep('mood_analysis', mood, moodDuration);
    console.log(`Detected mood: ${mood}`);

    // Step 2: Fetch user's library with smart sampling
    await progressTracker.updateStep('library_fetch', 'active', 'Scanning your music library...');
    console.log("Step 2: Smart library fetching...");
    const libStart = Date.now();
    const libraryTracks = await fetchLibraryEnhanced(token, mood);
    const libDuration = Date.now() - libStart;
    
    metadata.steps.push({
      step: 2,
      name: "library_fetch",
      result: `${libraryTracks.length} tracks`,
      duration: libDuration
    });
    
    await progressTracker.completeStep('library_fetch', `${libraryTracks.length} tracks`, libDuration);
    console.log(`Retrieved ${libraryTracks.length} tracks from library`);

    if (libraryTracks.length === 0) {
      console.warn("No tracks found in user's library, using enhanced Spotify recommendations");
      await progressTracker.updateStep('fallback_recommendations', 'active', 'Generating Spotify recommendations...');
      
      const fallbackStart = Date.now();
      const targetCount = outputFormat === 'track' ? 1 : 10;
      const fallbackTracks = await generateEnhancedSpotifyRecommendations(token, mood, prompt, targetCount);
      const fallbackDuration = Date.now() - fallbackStart;
      
      metadata.steps.push({
        step: "fallback",
        name: "spotify_recommendations",
        result: `${fallbackTracks.length} tracks`,
        duration: fallbackDuration
      });

      await progressTracker.completeStep('fallback_recommendations', `${fallbackTracks.length} tracks`, fallbackDuration);

      return {
        recommendations: fallbackTracks,
        mood: mood,
        metadata: { ...metadata, timing: { ...metadata.timing, total: Date.now() - metadata.timing.start } }
      };
    }

    // Step 3: Enhanced AI analysis with semantic understanding
    await progressTracker.updateStep('ai_track_analysis', 'active', 'AI selecting best matches...');
    console.log("Step 3: Enhanced AI track analysis...");
    const aiStart = Date.now();
    const targetCount = outputFormat === 'track' ? 5 : 20;
    const aiSelectedTracks = await analyzeTracksWithEnhancedAI(libraryTracks, prompt, mood, targetCount, userId);
    const aiDuration = Date.now() - aiStart;
    
    metadata.steps.push({
      step: 3,
      name: "ai_track_analysis",
      result: `${aiSelectedTracks.length} tracks selected`,
      duration: aiDuration
    });
    
    await progressTracker.completeStep('ai_track_analysis', `${aiSelectedTracks.length} tracks selected`, aiDuration);
    console.log(`AI selected ${aiSelectedTracks.length} tracks`);

    if (aiSelectedTracks.length === 0) {
      console.warn("AI couldn't find matching tracks, using enhanced fallback");
      await progressTracker.updateStep('ai_fallback', 'active', 'Using fallback recommendations...');
      
      const fallbackCount = outputFormat === 'track' ? 1 : 10;
      const fallbackTracks = await generateFallbackRecommendations(token, prompt, mood, [], fallbackCount);

      await progressTracker.completeStep('ai_fallback', `${fallbackTracks.length} fallback tracks`);

      return {
        recommendations: fallbackTracks,
        mood: mood,
        metadata: { ...metadata, timing: { ...metadata.timing, total: Date.now() - metadata.timing.start } }
      };
    }

    // Step 4: PARALLEL Audd.io analysis with simultaneous processing
    await progressTracker.updateStep('parallel_audd_analysis', 'active', 'Analyzing audio features...');
    console.log("Step 4: PARALLEL Audd.io audio feature analysis...");
    const featureStart = Date.now();

    const tracksWithFeatures = await enhancedFeatureAnalysisParallel(aiSelectedTracks, token);
    const featureDuration = Date.now() - featureStart;

    metadata.steps.push({
      step: 4,
      name: "parallel_audd_analysis",
      result: `${tracksWithFeatures.length} tracks enhanced (parallel processing)`,
      duration: featureDuration,
      parallelProcessing: true
    });
    
    await progressTracker.completeStep('parallel_audd_analysis', `${tracksWithFeatures.length} tracks enhanced`, featureDuration);
    console.log(`Enhanced ${tracksWithFeatures.length} tracks with parallel Audd.io analysis`);

    // Step 5: Semantic evaluation and alignment
    await progressTracker.updateStep('semantic_evaluation', 'active', 'Evaluating track quality...');
    console.log("Step 5: Semantic track alignment evaluation...");
    const evalStart = Date.now();
    const evaluation = await evaluateTrackAlignmentEnhanced(tracksWithFeatures, prompt, mood);
    const evalDuration = Date.now() - evalStart;
    
    metadata.steps.push({
      step: 5,
      name: "semantic_evaluation",
      result: `${evaluation.highQualityTracks.length} high-quality tracks`,
      duration: evalDuration
    });
    
    await progressTracker.completeStep('semantic_evaluation', `${evaluation.highQualityTracks.length} high-quality tracks`, evalDuration);
    console.log(`Found ${evaluation.highQualityTracks.length} high-quality tracks`);

    let finalTracks = evaluation.highQualityTracks;

    // Step 6: Quality assurance and fallback integration
    const minRequired = outputFormat === 'track' ? 1 : 5;
    if (finalTracks.length < minRequired) {
      await progressTracker.updateStep('quality_assurance', 'active', `Adding ${minRequired - finalTracks.length} more tracks...`);
      console.log(`Step 6: Fallback integration (have ${finalTracks.length}, need ${minRequired})`);

      const fallbackTracks = await generateFallbackRecommendations(
        token,
        prompt,
        mood,
        finalTracks,
        minRequired - finalTracks.length
      );

      finalTracks = [...finalTracks, ...fallbackTracks];
      await progressTracker.completeStep('quality_assurance', `Added ${fallbackTracks.length} fallback tracks`);
      console.log(`Added ${fallbackTracks.length} fallback tracks, total: ${finalTracks.length}`);
    }

    // Ensure we have at least something to return
    if (finalTracks.length === 0) {
      console.warn("Final fallback activation");
      const ultimateFallback = outputFormat === 'track' ? 1 : 10;
      finalTracks = await generateFallbackRecommendations(token, prompt, mood, [], ultimateFallback);
    }

    // Step 7: Format output based on type
    await progressTracker.updateStep('finalizing', 'active', 'Finalizing recommendations...');
    
    let result;
    if (outputFormat === 'track') {
      result = finalTracks.length > 0 ? [finalTracks[0]] : [];
    } else {
      result = finalTracks.slice(0, 15);
    }

    metadata.timing.total = Date.now() - metadata.timing.start;

    await progressTracker.completeStep('finalizing', `${result.length} recommendations ready`);

    console.log(`=== WORKFLOW COMPLETED IN ${metadata.timing.total}ms WITH PARALLEL PROCESSING ===`);

    return {
      recommendations: result,
      mood: mood,
      metadata: metadata
    };

  } catch (error) {
    console.error('Error in optimized mood recommendation workflow:', error);
    await progressTracker.setError('workflow_error', error.message);
    metadata.error = error.message;

    // Emergency fallback
    try {
      console.log("Attempting emergency fallback...");
      const emergencyCount = outputFormat === 'track' ? 1 : 10;
      const emergencyTracks = await generateFallbackRecommendations(token, prompt, "balanced", [], emergencyCount);

      return {
        recommendations: emergencyTracks,
        mood: "balanced",
        metadata: { ...metadata, timing: { ...metadata.timing, total: Date.now() - metadata.timing.start } }
      };
    } catch (fallbackError) {
      console.error('Emergency fallback also failed:', fallbackError);
      throw error;
    }
  }
}

// ENHANCED CLASSIC RECOMMENDATION WORKFLOW WITH PROGRESS TRACKING
async function processClassicRecommendations(prompt, token, outputFormat, progressTracker) {
  const metadata = {
    workflow: "classic",
    steps: [],
    timing: { start: Date.now() }
  };

  try {
    console.log("=== STARTING ENHANCED CLASSIC RECOMMENDATION WORKFLOW ===");

    // Step 1-5: Use the new enhanced classic recommendations system
    await progressTracker.updateStep('classic_generation', 'active', 'Generating classic recommendations...');
    console.log("Step 1-5: Enhanced classic song generation pipeline...");
    const classicStart = Date.now();
    const classicTracks = await generateClassicRecommendations(prompt, token);
    const classicDuration = Date.now() - classicStart;
    
    metadata.steps.push({
      step: "1-5",
      name: "enhanced_classic_generation",
      result: `${classicTracks.length} classic tracks found`,
      duration: classicDuration
    });
    
    await progressTracker.completeStep('classic_generation', `${classicTracks.length} classic tracks found`, classicDuration);
    console.log(`Generated ${classicTracks.length} classic recommendations`);

    if (classicTracks.length === 0) {
      await progressTracker.setError('classic_generation', 'Could not find classic songs matching the prompt');
      throw new Error("Could not find classic songs matching the prompt");
    }

    // Step 6: Format output based on type and user requirements
    await progressTracker.updateStep('formatting', 'active', 'Formatting results...');
    
    let result;
    const userRequestedCount = extractCountFromPrompt(prompt);

    if (outputFormat === 'track') {
      // Return single best classic track
      result = classicTracks.length > 0 ? [classicTracks[0]] : [];
    } else {
      // Return classic playlist with smart count determination
      const playlistSize = userRequestedCount || Math.min(classicTracks.length, 20);
      result = classicTracks.slice(0, playlistSize);
    }

    metadata.timing.total = Date.now() - metadata.timing.start;
    
    await progressTracker.completeStep('formatting', `${result.length} tracks formatted`);

    return {
      recommendations: result,
      metadata: metadata
    };

  } catch (error) {
    console.error('Error in enhanced classic recommendation workflow:', error);
    await progressTracker.setError('classic_workflow', error.message);
    metadata.error = error.message;
    metadata.timing.total = Date.now() - metadata.timing.start;
    throw error;
  }
}

// Keep all the existing helper functions unchanged
// (fetchLibraryEnhanced, smartSampleLibrary, analyzeTracksWithEnhancedAI, etc.)
// Just add the same functions from the original code here...

// Smart library fetching with mood-based sampling
async function fetchLibraryEnhanced(token, mood) {
  try {
    const allTracks = await fetchLibrary(token);

    if (allTracks.length <= 100) {
      return allTracks; // Return all if small library
    }

    // Smart sampling based on mood and audio features
    const sampledTracks = await smartSampleLibrary(allTracks, mood, 200);
    return sampledTracks;

  } catch (error) {
    console.error("Enhanced library fetch failed:", error);
    return await fetchLibrary(token);
  }
}

// Smart library sampling based on audio features
async function smartSampleLibrary(tracks, mood, targetCount) {
  try {
    // Define mood preferences for audio features
    const moodPreferences = {
      happy: { valence: [0.6, 1.0], energy: [0.5, 1.0] },
      sad: { valence: [0.0, 0.4], energy: [0.0, 0.5] },
      energetic: { energy: [0.7, 1.0], danceability: [0.6, 1.0] },
      calm: { valence: [0.3, 0.7], energy: [0.0, 0.4] },
      romantic: { valence: [0.4, 0.8], acousticness: [0.3, 1.0] },
      angry: { energy: [0.7, 1.0], valence: [0.0, 0.3] },
      balanced: { valence: [0.2, 0.8], energy: [0.2, 0.8] }
    };

    const preferences = moodPreferences[mood] || moodPreferences.balanced;

    // Score tracks based on mood preferences
    const scoredTracks = tracks.map(track => {
      let score = 0;
      let factors = 0;

      Object.entries(preferences).forEach(([feature, [min, max]]) => {
        if (track.audio_features && track.audio_features[feature] !== undefined) {
          const value = track.audio_features[feature];
          if (value >= min && value <= max) {
            score += 1;
          }
          factors += 1;
        }
      });

      // Normalize score
      const normalizedScore = factors > 0 ? score / factors : 0.5;

      return {
        ...track,
        mood_score: normalizedScore
      };
    });

    // Sort by mood score and add some randomness
    scoredTracks.sort((a, b) => {
      const scoreDiff = b.mood_score - a.mood_score;
      const randomFactor = (Math.random() - 0.5) * 0.1; // Small random factor
      return scoreDiff + randomFactor;
    });

    return scoredTracks.slice(0, targetCount);

  } catch (error) {
    console.error("Smart sampling failed:", error);
    // Fallback to random sampling
    const shuffled = [...tracks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, targetCount);
  }
}

// Enhanced AI track analysis with semantic understanding
async function analyzeTracksWithEnhancedAI(tracks, prompt, mood, targetCount, userId) {
  try {
    return await analyzeTracksWithAI(tracks, prompt, mood, userId, targetCount, {
      enhanced: true,
      useSemanticSimilarity: true,
      qualityThreshold: 0.7
    });
  } catch (error) {
    console.error("Enhanced AI analysis failed:", error);
    return await analyzeTracksWithAI(tracks, prompt, mood, userId, targetCount);
  }
}

// PARALLEL FEATURE ANALYSIS - This is the key optimization
async function enhancedFeatureAnalysisParallel(tracks, token) {
  try {
    console.log(`Starting PARALLEL Audd.io analysis for ${tracks.length} tracks...`);
    const startTime = Date.now();

    // Use the new parallel Audd.io analysis
    const results = await enhancedFeatureAnalysis(tracks, token);

    const analysisTime = Date.now() - startTime;
    console.log(`Parallel Audd.io analysis completed in ${analysisTime}ms`);

    // Add timing metadata to each track
    const resultsWithTiming = results.map(track => ({
      ...track,
      parallelAnalysisTime: analysisTime,
      analysisMethod: 'parallel_audd'
    }));

    return resultsWithTiming;

  } catch (error) {
    console.error("Parallel feature analysis failed:", error);

    // Fallback: add synthetic features to all tracks
    return tracks.map(track => ({
      ...track,
      audioFeatures: generateSyntheticAudioFeatures(track),
      features_source: 'synthetic_fallback',
      analysisMethod: 'fallback'
    }));
  }
}

// Generate synthetic audio features based on track metadata
function generateSyntheticAudioFeatures(track) {
  // Use track name, artist, and available metadata to make educated guesses
  const trackName = (track.name || '').toLowerCase();
  const artistName = (track.artists?.[0]?.name || '').toLowerCase();

  // Basic heuristics for common words/artists
  let valence = 0.5; // neutral default
  let energy = 0.5;
  let danceability = 0.5;
  let acousticness = 0.3;

  // Mood-based adjustments
  if (trackName.includes('sad') || trackName.includes('cry') || trackName.includes('blue')) {
    valence -= 0.3;
    energy -= 0.2;
  }
  if (trackName.includes('happy') || trackName.includes('joy') || trackName.includes('dance')) {
    valence += 0.3;
    energy += 0.2;
    danceability += 0.2;
  }
  if (trackName.includes('love') || trackName.includes('heart')) {
    valence += 0.1;
    acousticness += 0.2;
  }
  if (trackName.includes('rock') || trackName.includes('metal')) {
    energy += 0.3;
    acousticness -= 0.3;
  }
  if (trackName.includes('acoustic') || trackName.includes('piano')) {
    acousticness += 0.4;
    energy -= 0.2;
  }

  // Clamp values to valid range
  const clamp = (val) => Math.max(0, Math.min(1, val));

  return {
    valence: clamp(valence),
    energy: clamp(energy),
    danceability: clamp(danceability),
    acousticness: clamp(acousticness),
    instrumentalness: 0.1,
    liveness: 0.2,
    loudness: -8,
    speechiness: 0.1,
    tempo: 120
  };
}

// Enhanced track alignment evaluation with semantic similarity
async function evaluateTrackAlignmentEnhanced(tracks, prompt, mood) {
  try {
    return await evaluateTrackAlignment(tracks, prompt, mood, {
      enhanced: true,
      useSemanticSimilarity: true,
      qualityThreshold: 0.6,
      diversityFactor: 0.3
    });
  } catch (error) {
    console.error("Enhanced evaluation failed:", error);
    return await evaluateTrackAlignment(tracks, prompt, mood);
  }
}

// Enhanced Spotify recommendations with better search strategies
async function generateEnhancedSpotifyRecommendations(token, mood, prompt, targetCount) {
  try {
    // Multiple recommendation strategies
    const strategies = [
      { seed_genres: getMoodGenres(mood), limit: Math.ceil(targetCount / 2) },
      { seed_genres: getPromptGenres(prompt), limit: Math.floor(targetCount / 2) }
    ];

    const allRecommendations = [];

    for (const strategy of strategies) {
      try {
        const params = new URLSearchParams({
          ...strategy,
          market: 'US',
          ...getMoodAudioFeatures(mood)
        });

        const response = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          allRecommendations.push(...(data.tracks || []));
        }
      } catch (strategyError) {
        console.warn("Recommendation strategy failed:", strategyError.message);
      }
    }

    // Remove duplicates and return
    const unique = removeDuplicateSpotifyTracks(allRecommendations);
    return unique.slice(0, targetCount);

  } catch (error) {
    console.error("Enhanced Spotify recommendations failed:", error);
    return await generateFallbackRecommendations(token, prompt, mood, [], targetCount);
  }
}

// Helper functions for enhanced Spotify recommendations
function getMoodGenres(mood) {
  const moodGenres = {
    happy: ['pop', 'dance', 'funk'],
    sad: ['indie', 'alternative', 'blues'],
    energetic: ['rock', 'electronic', 'hip-hop'],
    calm: ['ambient', 'classical', 'folk'],
    romantic: ['r-n-b', 'soul', 'jazz'],
    angry: ['metal', 'punk', 'hard-rock'],
    balanced: ['pop', 'rock', 'indie']
  };

  return moodGenres[mood] || moodGenres.balanced;
}

function getPromptGenres(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('rock')) return ['rock', 'alternative'];
  if (lowerPrompt.includes('pop')) return ['pop', 'dance'];
  if (lowerPrompt.includes('jazz')) return ['jazz', 'blues'];
  if (lowerPrompt.includes('classical')) return ['classical'];
  if (lowerPrompt.includes('hip hop') || lowerPrompt.includes('rap')) return ['hip-hop', 'rap'];
  if (lowerPrompt.includes('country')) return ['country'];
  if (lowerPrompt.includes('electronic')) return ['electronic', 'techno'];

  return ['pop', 'rock']; // default
}

function getMoodAudioFeatures(mood) {
  const features = {
    happy: { target_valence: 0.8, target_energy: 0.7 },
    sad: { target_valence: 0.2, target_energy: 0.3 },
    energetic: { target_energy: 0.9, target_danceability: 0.8 },
    calm: { target_valence: 0.5, target_energy: 0.2 },
    romantic: { target_valence: 0.6, target_acousticness: 0.6 },
    angry: { target_energy: 0.9, target_valence: 0.2 },
    balanced: { target_valence: 0.5, target_energy: 0.5 }
  };

  return features[mood] || features.balanced;
}

function removeDuplicateSpotifyTracks(tracks) {
  const seen = new Set();
  return tracks.filter(track => {
    const key = `${track.name}-${track.artists[0]?.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Extract count from user prompt (e.g., "recommend 15 songs")
function extractCountFromPrompt(prompt) {
  const matches = prompt.match(/\b(\d+)\s*(?:songs?|tracks?|recommendations?)\b/i);
  if (matches) {
    const count = parseInt(matches[1]);
    return count > 0 && count <= 50 ? count : null; // Reasonable limits
  }
  return null;
}