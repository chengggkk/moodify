"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import AudioFeaturesDisplay from './components/AudioFeaturesDisplay';
import StoryModal from './components/StoryModal';
import FeedbackButton from './components/FeedbackButton';
import { styles } from './styles';
import EnhancedProgressDisplay from './components/EnhancedProgressDisplay'

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Icon components
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 2.5v11l10-5.5L3 2.5z" />
  </svg>
);

const StoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2 1v10h8V3H4zm2 2h4v2H6V5zm0 3h4v2H6V8zm0 3h2v2H6v-2z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

const LoadingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="animate-spin">
    <path opacity="0.3" d="M8 1a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5V1z" />
    <path d="M8 1v2a5 5 0 0 1 5 5h2a7 7 0 0 0-7-7z" />
  </svg>
);

// Helper function to get step results for simulation
const getStepResult = (stepId) => {
  const results = {
    'mood_analysis': 'balanced',
    'library_fetch': '95 tracks',
    'ai_track_analysis': '30 tracks selected',
    'parallel_audd_analysis': '30 tracks enhanced',
    'semantic_evaluation': '26 high-quality tracks',
    'finalizing': 'Complete!'
  };
  return results[stepId] || 'Processing...';
};

// Processing Steps Component
const ProcessingSteps = ({ steps, currentStep, isGenerating }) => {
  const stepDefinitions = [
    { id: 'mood_analysis', label: 'Analyzing your mood', icon: '🎭' },
    { id: 'library_fetch', label: 'Scanning your music library', icon: '📚' },
    { id: 'ai_track_analysis', label: 'AI selecting best matches', icon: '🤖' },
    { id: 'parallel_audd_analysis', label: 'Analyzing audio features', icon: '🎵' },
    { id: 'semantic_evaluation', label: 'Evaluating track quality', icon: '✨' },
    { id: 'quality_assurance', label: 'Quality assurance check', icon: '🔍' },
    { id: 'finalizing', label: 'Finalizing recommendations', icon: '🎯' },
    { id: 'story_generation', label: 'Generating playlist story', icon: '📝' }
  ];

  return (
    <div className="processing-container">
      <h3 className="processing-title">
        {isGenerating ? 'Generating your personalized recommendations...' : 'Process complete!'}
      </h3>

      <div className="processing-steps">
        {stepDefinitions.map((stepDef, index) => {
          const stepData = steps.find(s => s.name === stepDef.id);
          const isActive = currentStep === stepDef.id;
          const isCompleted = stepData && stepData.completed;
          const isError = stepData && stepData.status === 'error';
          const isPending = !stepData && !isActive && isGenerating;

          return (
            <div
              key={stepDef.id}
              className="processing-step"
              style={{
                opacity: isPending ? 0.4 : 1,
                color: isError ? '#ff6b6b' : 'inherit'
              }}
            >
              <div className={`step-icon ${isError ? 'error' :
                isCompleted ? 'completed' :
                  isActive ? 'active' : 'pending'
                }`}>
                {isError ? '❌' :
                  isCompleted ? <CheckIcon /> :
                    isActive ? <LoadingIcon /> :
                      stepDef.icon}
              </div>

              <div className="step-content">
                <div className={`step-label ${isError ? 'error' :
                  isActive ? 'active' :
                    isCompleted ? 'completed' : ''
                  }`}>
                  {stepDef.label}
                </div>
                {stepData && stepData.result && (
                  <div className="step-result">
                    {stepData.result} {stepData.duration && `(${stepData.duration}ms)`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isGenerating && steps.length > 0 && (
        <div className="processing-summary">
          Total processing time: {steps.reduce((total, step) => total + (step.duration || 0), 0)}ms
          <br />
          Steps completed: {steps.filter(s => s.completed).length}/{steps.length}
        </div>
      )}
    </div>
  );
};


// Toggle Switch Component
const ToggleSwitch = ({ isOn, label, leftText, rightText, onToggle }) => {
  return (
    <div style={styles.toggleContainer}>
      <span style={styles.toggleLabel}>{label}</span>
      <div
        style={{
          ...styles.toggleButton,
          ...(isOn ? styles.toggleButtonActive : {})
        }}
        onClick={onToggle}
      >
        <div style={{
          ...styles.toggleSlider,
          ...(isOn ? styles.toggleSliderActive : {})
        }} />
        <span style={{
          ...styles.toggleText,
          ...styles.toggleTextRight,
          opacity: isOn ? 0 : 1
        }}>{leftText}</span>
        <span style={{
          ...styles.toggleText,
          ...styles.toggleTextLeft,
          opacity: isOn ? 1 : 0
        }}>{rightText}</span>
      </div>
    </div>
  );
};
const TrackCard = ({ track, index, isRecommendation, onStoryClick, isLoading, clickedTrackId, userData, onFeedbackSubmitted, expanded, onToggleExpand }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="track-card"
      style={{
        ...styles.trackCard,
        ...(isHovered ? styles.trackCardHover : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="track-main">
        <span className="track-number">{index + 1}</span>

        <div className="track-content">
          <div className="track-image-container">
            {track.album.images && track.album.images.length > 0 && (
              <Image
                src={track.album.images[1]?.url || track.album.images[0].url}
                alt={track.album.name}
                width={60}
                height={60}
                className="track-image"
                unoptimized={true}
              />
            )}
          </div>

          <div className="track-info">
            <div className="track-name">{track.name}</div>
            <div className="track-artist">
              {track.artists.map(artist => artist.name).join(', ')}
            </div>
          </div>
        </div>
      </div>

      <div className="track-actions">
        <a
          href={track.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="action-button spotify-play-button"
          style={styles.spotifyPlayButton}
        >
          <PlayIcon />
          <span className="button-text">Play</span>
        </a>

        <button
          onClick={() => onStoryClick(track.id, track.artists[0].name, track.name)}
          className="action-button story-button"
          style={{
            ...styles.actionButton,
            ...(isLoading && clickedTrackId === track.id ? styles.buttonDisabled : {}),
            backgroundColor: 'rgba(231, 231, 137, 0.2)',
            color: '#73669F',
            background: 'none', // Explicitly override any background shorthand
          }}
          disabled={isLoading && clickedTrackId === track.id}
        >
          <StoryIcon />
          <span className="button-text">
            {isLoading && clickedTrackId === track.id ? 'Loading...' : 'Story'}
          </span>
        </button>
      </div>

      {/* Expanded details for recommendations */}
      {isRecommendation && expanded && (
        <div style={styles.trackDetails}>
          {track.audioFeatures && (
            <AudioFeaturesDisplay features={track.audioFeatures} />
          )}

          {track.lyricsInfo && (
            <div style={styles.lyricsInfo}>
              <div style={styles.lyricsSentiment}>
                <span style={styles.label}>Sentiment:</span>
                <span style={{
                  ...styles.sentimentBadge,
                  ...(track.lyricsInfo.sentiment === 'positive' ? styles.sentimentPositive :
                    track.lyricsInfo.sentiment === 'negative' ? styles.sentimentNegative :
                      styles.sentimentNeutral)
                }}>
                  {track.lyricsInfo.sentiment}
                </span>
              </div>

              {track.lyricsInfo.themes && track.lyricsInfo.themes.length > 0 && (
                <div style={styles.lyricsThemes}>
                  <span style={styles.label}>Themes:</span>
                  <div style={styles.themesList}>
                    {track.lyricsInfo.themes.map((theme, i) => (
                      <span key={i} style={styles.themeTag}>{theme}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={styles.feedbackWrapper}>
        <FeedbackButton
          trackId={track.id}
          userId={userData?.id}
          onFeedbackSubmitted={onFeedbackSubmitted}
        />
      </div>
    </div>
  );
};
export default function Home() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication and user state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [topTracks, setTopTracks] = useState([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // Toggle states
  const [moodMode, setMoodMode] = useState(true);
  const [playlistMode, setPlaylistMode] = useState(true);
  const [customMode, setCustomMode] = useState(false);
  const [customStory, setCustomStory] = useState('');

  // Recommendations state
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationStory, setRecommendationStory] = useState('');
  const [generatedPlaylist, setGeneratedPlaylist] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [audioFeaturesData, setAudioFeaturesData] = useState(null);
  const [expandedTrackId, setExpandedTrackId] = useState(null);

  // Processing steps state
  const [processingSteps, setProcessingSteps] = useState([]);
  const [currentProcessingStep, setCurrentProcessingStep] = useState(null);

  // Story modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [story, setStory] = useState(null);
  const [trackId, setTrackId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clickedTrackId, setClickedTrackId] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);

  const [lyrics, setLyrics] = useState('');
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);



  // Sample prompt buttons
  const samplePrompts = [
    "Upbeat morning workout",
    "Calm focus for studying",
    "Friday night party vibes",
  ];

  // Callback handlers
  const handleFeedbackSubmitted = useCallback((trackId, feedback) => {
    console.log(`Feedback submitted for track ${trackId}: ${feedback}`);
  }, []);

  const fetchUserProfile = useCallback(async (token) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        setUserData(profile);
      } else {
        if (response.status === 401) {
          handleLogout();
        }
        const errorData = await response.json();
        console.error('Failed to fetch user profile:', errorData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  const fetchTopTracks = useCallback(async () => {
    if (!accessToken) return;

    setIsLoadingTracks(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=5', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTopTracks(data.items);
      } else {
        if (response.status === 401) {
          handleLogout();
        }
        console.error('Failed to fetch top tracks:', await response.json());
      }
    } catch (error) {
      console.error('Error fetching top tracks:', error);
    } finally {
      setIsLoadingTracks(false);
    }
  }, [accessToken]);

  const exchangeCodeForToken = useCallback(async (code) => {
    try {
      console.log('Exchanging code for token...');

      const response = await fetch('/api/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textContent = await response.text();
        console.error('Non-JSON response:', textContent);
        setError('Server returned invalid response format');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('Token exchange error:', data);
        setError(data.error || 'Failed to authenticate with Spotify');
        return;
      }

      if (data.access_token) {
        console.log('Token received successfully');
        localStorage.setItem('spotify_access_token', data.access_token);

        const expiryTime = Date.now() + (data.expires_in * 1000);
        localStorage.setItem('spotify_token_expiry', expiryTime.toString());

        setAccessToken(data.access_token);
        setIsLoggedIn(true);
        fetchUserProfile(data.access_token);

        window.history.replaceState({}, document.title, '/');
      } else {
        console.error('No access token in response:', data);
        setError('Failed to receive access token from Spotify');
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      setError('An error occurred during authentication');
    }
  }, [fetchUserProfile]);

  const handleLogout = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
    setAccessToken('');
    setIsLoggedIn(false);
    setUserData(null);
    setTopTracks([]);
    setRecommendations([]);
    setRecommendationStory('');
    setGeneratedPlaylist(null);
    setAiInsights([]);
    setAudioFeaturesData(null);
    setMobileMenuOpen(false);
    setProcessingSteps([]);
    setCurrentProcessingStep(null);
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = queryParams.get('access_token');
    const error = queryParams.get('error');
    const tokenReceived = queryParams.get('token_received');
    const code = queryParams.get('code');

    if (error) {
      setError(error.replace(/_/g, ' '));
      window.history.replaceState({}, document.title, '/');
    }

    if (accessToken && tokenReceived === 'true') {
      console.log('Token received directly in URL');
      const expiresIn = parseInt(queryParams.get('expires_in') || '3600');

      localStorage.setItem('spotify_access_token', accessToken);
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem('spotify_token_expiry', expiryTime.toString());

      setAccessToken(accessToken);
      setIsLoggedIn(true);
      fetchUserProfile(accessToken);

      window.history.replaceState({}, document.title, '/');
      return;
    }

    if (code) {
      console.log('Code found in URL, exchanging for token');
      exchangeCodeForToken(code);
      return;
    }

    const storedToken = localStorage.getItem('spotify_access_token');
    const tokenExpiry = localStorage.getItem('spotify_token_expiry');

    if (storedToken && tokenExpiry && Number(tokenExpiry) > Date.now()) {
      console.log('Using stored token from localStorage');
      setAccessToken(storedToken);
      setIsLoggedIn(true);
      fetchUserProfile(storedToken);
    } else if (storedToken && tokenExpiry) {
      console.log('Stored token has expired');
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_token_expiry');
    }
  }, [exchangeCodeForToken, fetchUserProfile]);

  useEffect(() => {
    if (accessToken) {
      fetchTopTracks();
    }
  }, [accessToken, fetchTopTracks]);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const toggleTrackDetails = (trackId) => {
    if (expandedTrackId === trackId) {
      setExpandedTrackId(null);
    } else {
      setExpandedTrackId(trackId);
    }
  };

  // Updated generateRecommendations function with proper progress integration
  const generateRecommendations = async () => {
    if (!isLoggedIn) {
      setError('Please connect to Spotify first');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a mood or vibe');
      return;
    }

    setIsGenerating(true);
    setError('');
    setRecommendations([]);
    setRecommendationStory('');
    setGeneratedPlaylist(null);
    setAiInsights([]);
    setAudioFeaturesData(null);

    // Generate unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentRequestId(requestId);

    try {
      if (!accessToken) {
        throw new Error('No access token available. Please reconnect to Spotify.');
      }

      console.log('Starting recommendations with request ID:', requestId);

      // Initialize progress tracking on the server
      await fetch('/api/recommendations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: requestId,
          action: 'create'
        })
      });

      // Start the main recommendation process
      const recommendationResponse = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          token: accessToken,
          customStory: customMode ? customStory : '',
          seedTracks: topTracks.map(track => track.id),
          recommendationType: moodMode ? 'mood' : 'classic',
          outputFormat: playlistMode ? 'playlist' : 'track',
          requestId: requestId
        }),
      });

      console.log('Recommendation API response status:', recommendationResponse.status);

      if (!recommendationResponse.ok) {
        let errorMessage = `Failed to generate recommendations: ${recommendationResponse.status} ${recommendationResponse.statusText}`;

        try {
          const errorData = await recommendationResponse.json();
          if (errorData && errorData.error) {
            errorMessage = `Error: ${errorData.error}`;
          }
        } catch (jsonError) {
          try {
            const errorText = await recommendationResponse.text();
            console.error('Recommendation API error response:', errorText);
          } catch (textError) {
            console.error('Could not parse error response');
          }
        }

        throw new Error(errorMessage);
      }

      const recommendationData = await recommendationResponse.json();

      // Validate response data
      if (!recommendationData.recommendations || recommendationData.recommendations.length === 0) {
        throw new Error('No recommendations found. Try a different mood or prompt.');
      }

      // Set the main recommendation data
      setRecommendations(recommendationData.recommendations);
      setAudioFeaturesData(recommendationData.audioFeatures || null);
      setRecommendationStory(recommendationData.story || '');

      console.log(`Successfully generated ${recommendationData.recommendations.length} recommendations`);

      // Enhanced AI insights (parallel processing)
      const aiInsightsPromise = fetch('/api/ai-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          token: accessToken,
          topTracks: topTracks,
          recommendedTracks: recommendationData.recommendations,
          audioFeatures: recommendationData.audioFeatures || {},
          mood: recommendationData.mood || 'balanced'
        }),
      }).then(response => {
        if (response.ok) {
          return response.json();
        }
        return null;
      }).then(aiData => {
        if (aiData) {
          if (aiData.story) setRecommendationStory(aiData.story);
          if (aiData.insightfulComments) setAiInsights(aiData.insightfulComments);
        }
      }).catch(aiError => {
        console.error('Error enhancing with AI insights:', aiError);
      });

      // Playlist creation (if requested)
      const playlistPromise = playlistMode && recommendationData.recommendations.length > 0
        ? fetch('/api/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: accessToken,
            createPlaylistFlag: true,
            playlistName: `${prompt.substring(0, 20)}... Mix`,
            customStory: recommendationData.story || customStory,
            manualTracks: recommendationData.recommendations
          }),
        }).then(response => {
          if (response.ok) {
            return response.json();
          }
          return null;
        }).then(playlistData => {
          if (playlistData && playlistData.playlist) {
            setGeneratedPlaylist(playlistData.playlist);
          }
        }).catch(playlistError => {
          console.error('Error creating playlist:', playlistError);
        })
        : Promise.resolve();

      // Wait for parallel operations to complete
      await Promise.allSettled([aiInsightsPromise, playlistPromise]);

      console.log('All recommendation processes completed successfully');

    } catch (error) {
      console.error('Error generating recommendations:', error);

      setError(error.message || 'Failed to generate recommendations');
      setRecommendations([]);
      setRecommendationStory('');
      setAiInsights([]);
      setAudioFeaturesData(null);

      // Update progress with error
      try {
        await fetch('/api/recommendations/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: requestId,
            action: 'error',
            message: error.message
          })
        });
      } catch (progressError) {
        console.error('Error updating progress with error:', progressError);
      }
    } finally {
      setIsGenerating(false);
      setCurrentRequestId(null);
    }
  };


  // Progress completion handler
  const handleProgressComplete = (result) => {
    console.log('Progress completed with result:', result);
    setIsGenerating(false);
    setCurrentRequestId(null);

    // Final cleanup can be done here if needed
    // The actual recommendation data should already be set by the main function
  };

  // Progress error handler
  const handleProgressError = (error) => {
    console.error('Progress error:', error);
    setError(error);
    setIsGenerating(false);
    setCurrentRequestId(null);
  };
  // Function to fetch lyrics
  const fetchLyricsForTrack = async (artist, song) => {
    console.log('Fetching lyrics for:', { artist, song });

    setIsLoadingLyrics(true);
    setError(null);

    try {
      const requestBody = {
        artist: artist?.trim() || '',
        song: song?.trim() || ''
      };

      console.log('Lyrics request body:', requestBody);

      const response = await fetch('/api/fetch_lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Lyrics response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lyrics response error:', errorText);
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Lyrics response data:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.lyrics || data.lyrics.length < 10) {
        throw new Error('No lyrics found or lyrics too short');
      }

      console.log('Lyrics fetched successfully, length:', data.lyrics.length);
      return data.lyrics;

    } catch (error) {
      console.error('Error in fetchLyricsForTrack:', error.message);
      throw error;
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  // Function to generate story from lyrics
  const generateStoryFromLyrics = async (lyrics, artist, song) => {
    console.log('Generating story from lyrics for:', { artist, song });

    setIsLoadingStory(true);
    setError(null);

    try {
      const requestBody = {
        lyrics: lyrics,
        artist: artist?.trim() || '',
        song: song?.trim() || '',
        customStory: customStory?.trim() || ''
      };

      console.log('Story generation request body keys:', Object.keys(requestBody));

      const response = await fetch('/api/story_agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Story response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Story response error:', errorText);
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Story response data keys:', Object.keys(data));

      if (data.error) {
        throw new Error(data.error);
      }

      // Handle different possible response structures
      let story = null;

      if (data.story) {
        story = data.story;
        console.log('Found story in data.story');
      } else if (data.generated_story) {
        story = data.generated_story;
        console.log('Found story in data.generated_story');
      } else {
        console.log('Available response fields:', Object.keys(data));
        const possibleStoryFields = ['story', 'generated_story', 'content', 'text', 'result'];
        for (const field of possibleStoryFields) {
          if (data[field] && typeof data[field] === 'string' && data[field].length > 50) {
            story = data[field];
            console.log(`Found story in data.${field}`);
            break;
          }
        }
      }

      if (!story) {
        throw new Error('No story content found in response');
      }

      console.log('Story generated successfully, length:', story.length);
      return story;

    } catch (error) {
      console.error('Error in generateStoryFromLyrics:', error.message);
      throw error;
    } finally {
      setIsLoadingStory(false);
    }
  };

  // Updated handleTrackClick function
  const handleTrackClick = async (trackId, artist, song) => {
    console.log('Track clicked:', { trackId, artist, song });

    setClickedTrackId(trackId);
    setError(null);
    setLyrics(''); // Clear previous lyrics
    setStory(''); // Clear previous story

    // Immediately open modal with loading state
    setIsModalOpen(true);
    setTrackId(trackId);

    try {
      // Step 1: Fetch lyrics first
      console.log('Step 1: Fetching lyrics...');
      const trackLyrics = await fetchLyricsForTrack(artist, song);

      if (trackLyrics && trackLyrics.length > 0) {
        setLyrics(trackLyrics);
        console.log('Lyrics set in state, length:', trackLyrics.length);

        // Step 2: Generate story from the fetched lyrics
        console.log('Step 2: Generating story from lyrics...');
        const trackStory = await generateStoryFromLyrics(trackLyrics, artist, song);

        if (trackStory && trackStory.length > 0) {
          setStory(trackStory);
          console.log('Story set in state, length:', trackStory.length);
        } else {
          setStory('Story generation completed but no content was returned. Please try again.');
        }
      } else {
        setLyrics('Unable to fetch lyrics for this track.');
        setStory('Cannot generate story without lyrics. Please try again.');
      }

    } catch (error) {
      console.error('Error in handleTrackClick:', error);
      const errorMessage = `Error: ${error.message}. Please try again.`;

      if (isLoadingLyrics) {
        setLyrics(`Error fetching lyrics: ${error.message}`);
      } else if (isLoadingStory) {
        setStory(`Error generating story: ${error.message}`);
      } else {
        setLyrics(errorMessage);
        setStory(errorMessage);
      }
    } finally {
      setClickedTrackId(null);
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <Image
            src="/logo.png"
            alt="Moodify Logo"
            width={40}
            height={40}
          />
          <h1 style={styles.logoText}>Moodify</h1>
        </div>

        <button
          style={{
            ...styles.mobileMenuButton,
            ...(mobileMenuOpen ? styles.mobileMenuButtonOpen : {})
          }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div style={{
          ...styles.navRight,
          ...(mobileMenuOpen ? styles.navRightMobile : {})
        }}>
          {isLoggedIn && userData ? (
            <div style={styles.userProfile}>
              {!isMobile && (
                <span style={styles.userName}>
                  {userData.display_name}
                </span>
              )}

              {userData.images && userData.images.length > 0 ? (
                <Image
                  src={userData.images[0].url}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  style={styles.userAvatar}
                  unoptimized={true}
                />
              ) : (
                <div style={styles.userAvatarPlaceholder}>
                  {userData.display_name ? userData.display_name[0].toUpperCase() : 'U'}
                </div>
              )}
              <button
                onClick={handleLogout}
                style={styles.logoutButton}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              style={styles.spotifyButton}
              onClick={handleLogin}
            >
              Connect Spotify
            </button>
          )}
        </div>
      </nav>

      <main style={styles.mainContainer}>
        <div style={styles.heroSection}>
          <h1 style={styles.mainTitle}>Generate Music Based on Your Mood</h1>
          <p style={styles.mainDescription}>
            Describe how you're feeling or what vibe you're looking for, and we'll create the perfect playlist
          </p>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            Error: {error}
          </div>
        )}

        <div style={styles.settingsSection}>
          <h2 style={styles.sectionTitle}>Settings</h2>
          <div style={styles.settingsGrid}>
            <ToggleSwitch
              isOn={moodMode}
              label="Recommendation Type"
              leftText="Classic"
              rightText="Mood"
              onToggle={() => setMoodMode(!moodMode)}
            />
            <ToggleSwitch
              isOn={playlistMode}
              label="Output Format"
              leftText="Track"
              rightText="Playlist"
              onToggle={() => setPlaylistMode(!playlistMode)}
            />
            <ToggleSwitch
              isOn={customMode}
              label="Story Style"
              leftText="Classic"
              rightText="Custom"
              onToggle={() => setCustomMode(!customMode)}
            />
            {customMode && (
              <div style={styles.customStoryContainer}>
                <input
                  type="text"
                  placeholder="e.g., 'A traveler discovering new sounds...'"
                  value={customStory}
                  onChange={(e) => setCustomStory(e.target.value)}
                  style={styles.customStoryInput}
                />
              </div>
            )}
          </div>
        </div>

        <div style={styles.inputSection}>
          <div style={styles.inputContainer}>
            <label style={styles.inputLabel} htmlFor="mood-prompt">
              Enter your mood or vibe
            </label>
            <input
              id="mood-prompt"
              type="text"
              placeholder="e.g., 'Upbeat music for a morning workout' or 'Calm piano for reading'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={styles.moodInput}
            />

            <div style={styles.samplePrompts}>
              {samplePrompts.map((samplePrompt, index) => (
                <button
                  key={index}
                  style={styles.samplePrompt}
                  onClick={() => setPrompt(samplePrompt)}
                >
                  {samplePrompt}
                </button>
              ))}
            </div>

            <button
              onClick={generateRecommendations}
              disabled={!isLoggedIn || !prompt || isGenerating}
              style={{
                ...styles.generateButton,
                ...(!isLoggedIn || !prompt || isGenerating ? styles.buttonDisabled : {})
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Recommendations'}
            </button>
          </div>
        </div>

        {(isGenerating || currentRequestId) && (
          <EnhancedProgressDisplay
            requestId={currentRequestId}
            isGenerating={isGenerating}
            onComplete={handleProgressComplete}
            onError={handleProgressError}
          />
        )}


        {isLoggedIn && (
          <div style={styles.tracksSection}>
            <h2 style={styles.sectionTitle}>Your Top Tracks</h2>

            {isLoadingTracks ? (
              <div style={styles.loadingSpinner}>Loading your top tracks...</div>
            ) : topTracks.length > 0 ? (
              <div style={styles.tracksList}>
                {topTracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    index={index}
                    isRecommendation={false}
                    onStoryClick={handleTrackClick}
                    isLoading={isLoading}
                    clickedTrackId={clickedTrackId}
                    userData={userData}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                    expanded={false}
                    onToggleExpand={() => { }}
                  />
                ))}
              </div>
            ) : (
              <div style={styles.loadingSpinner}>No top tracks found. Try listening to more music on Spotify!</div>
            )}
          </div>
        )}

        {recommendations.length > 0 && (
          <div style={styles.recommendationsSection}>
            <h2 style={styles.sectionTitle}>Your Personalized Recommendations</h2>

            {audioFeaturesData && (
              <div style={styles.moodFeatures}>
                <h3>Target Audio Profile</h3>
                <AudioFeaturesDisplay features={audioFeaturesData} />
              </div>
            )}

            {recommendationStory && (
              <div style={styles.storyText}>
                {recommendationStory}
              </div>
            )}

            <div style={styles.tracksList}>
              {recommendations.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  index={index}
                  isRecommendation={true}
                  onStoryClick={handleTrackClick}
                  isLoading={isLoading}
                  clickedTrackId={clickedTrackId}
                  userData={userData}
                  onFeedbackSubmitted={handleFeedbackSubmitted}
                  expanded={expandedTrackId === track.id}
                  onToggleExpand={toggleTrackDetails}
                />
              ))}
            </div>

            {aiInsights && aiInsights.length > 0 && (
              <div style={styles.insightsSection}>
                <div style={styles.insightsTitle}>AI Music Insights</div>
                <div style={styles.insightsList}>
                  {aiInsights.map((insight, index) => (
                    <div key={index} style={styles.insightItem}>
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatedPlaylist && (
              <div style={styles.playlistSection}>
                <div style={styles.playlistTitle}>
                  Playlist Created: {generatedPlaylist.name}
                </div>
                <p style={styles.playlistDescription}>{generatedPlaylist.description}</p>
                <div style={styles.playlistActions}>
                  <a
                    href={generatedPlaylist.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...styles.actionButton,
                      ...styles.spotifyPlayButton
                    }}
                  >
                    Open in Spotify
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      {isModalOpen && (
        <>
          {console.log('Rendering modal with:', { story, trackId, isModalOpen })}
          <StoryModal
            lyrics={lyrics}
            story={story || 'No story available'}
            trackId={trackId}
            isLoading={isLoading}
            onClose={() => {
              console.log('Modal onClose triggered');
              setIsModalOpen(false);
              setStory(null);
              setTrackId(null);
              setError(null);
            }}
          />
        </>
      )}
    </div>
  );
}