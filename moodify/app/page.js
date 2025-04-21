"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import AudioFeaturesDisplay from './components/AudioFeaturesDisplay';


// Define styles directly in the component
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f0f1a',
    color: 'white',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ff7e5f',
    background: 'linear-gradient(90deg, #ff7e5f, #fe4a85)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '1.5rem',
  },
  buttonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(255, 126, 95, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    background: '#555',
  },
  navbar: {
    width: '100%',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: '#0f0f1a',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoText: {
    fontSize: '2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, #ff7e5f, #feb47b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  spotifyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#1DB954', // Spotify green
    color: 'white',
    border: 'none',
    borderRadius: '2rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userName: {
    fontWeight: '500',
    fontSize: '1rem',
    color: 'white',
  },
  userAvatar: {
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.2)',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 1.5rem',
  },
  inputContainer: {
    width: '100%',
    maxWidth: '800px',
    marginTop: '1rem',
  },
  promptInput: {
    width: '100%',
    padding: '1.25rem',
    fontSize: '1.125rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  promptInputFocus: {
    border: '1px solid rgba(255, 126, 95, 0.5)',
    boxShadow: '0 0 0 4px rgba(255, 126, 95, 0.1)',
  },
  promptLabel: {
    display: 'block',
    marginBottom: '0.75rem',
    fontSize: '1.125rem',
    fontWeight: '500',
  },
  title: {
    margin: 0,
    lineHeight: 1.15,
    fontSize: '2.5rem',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #ff7e5f, #ff556e, #d16ba5, #c777b9)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    padding: '0.5rem 0',
  },
  description: {
    textAlign: 'center',
    lineHeight: '1.5',
    fontSize: '1.25rem',
    margin: '1rem 0 2rem 0',
    opacity: 0.9,
    maxWidth: '600px',
  },
  error: {
    color: '#ff5555',
    marginBottom: '1.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'rgba(255, 85, 85, 0.1)',
    borderRadius: '8px',
    borderLeft: '4px solid #ff5555',
    maxWidth: '800px',
    width: '100%',
  },
  switchesContainer: {
    width: '100%',
    maxWidth: '800px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  switchRow: {
    display: 'flex',
    flexDirection: 'column',
    width: 'calc(50% - 0.5rem)',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },
  switchLabel: {
    fontWeight: '500',
    fontSize: '0.875rem',
    marginBottom: '0.5rem',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Updated toggle button styles
  toggleButton: {
    position: 'relative',
    width: '120px',
    height: '30px',
    borderRadius: '15px',
    background: 'rgba(30, 30, 45, 0.5)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    padding: '0 4px',
    overflow: 'hidden',
  },
  toggleButtonActive: {
    background: 'linear-gradient(90deg, #ff7e5f, #fe4a85)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0 0 10px rgba(255, 126, 95, 0.3)',
  },
  toggleButtonInactive: {
    background: 'linear-gradient(90deg, #4a6eff, #7e56c9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 0 10px rgba(74, 110, 255, 0.2)',
  },
  toggleSlider: {
    position: 'absolute',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: 'white',
    transition: 'transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
    transform: 'translateX(0)',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  },
  toggleSliderActive: {
    transform: 'translateX(90px)',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
  },
  toggleSliderInactive: {
    transform: 'translateX(0)',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
  },
  toggleText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    transition: 'opacity 0.3s ease',
    color: 'rgba(255, 255, 255, 0.8)',
    opacity: 0.9,
    userSelect: 'none',
  },
  toggleTextOn: {
    right: '20px',
    color: 'white',
    textShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
  },
  toggleTextOff: {
    left: '20px',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  settingsSection: {
    width: '100%',
    maxWidth: '800px',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    width: '100%',
    maxWidth: '800px',
  },
  customizeInputContainer: {
    width: 'calc(50% - 0.5rem)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
  },
  customInput: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  customInputFocus: {
    border: '1px solid rgba(255, 126, 95, 0.5)',
    boxShadow: '0 0 0 3px rgba(255, 126, 95, 0.1)',
  },
  // New styles for top tracks section
  topTracksSection: {
    width: '100%',
    maxWidth: '800px',
    marginTop: '2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  tracksList: {
    listStyle: 'none',
    padding: 0,
    margin: '1rem 0 0 0',
  },
  trackItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  trackNumber: {
    width: '30px',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  trackImage: {
    borderRadius: '4px',
    marginRight: '1rem',
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  trackArtist: {
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingIndicator: {
    textAlign: 'center',
    padding: '1rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Recommendations styles
  recommendationsSection: {
    width: '100%',
    maxWidth: '800px',
    marginTop: '2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  storyText: {
    fontStyle: 'italic',
    marginBottom: '1.5rem',
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    lineHeight: '1.6',
  },
  recommendationsList: {
    listStyle: 'none',
    padding: 0,
    margin: '1rem 0 0 0',
  },
  playlistInfo: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(29, 185, 84, 0.1)', // Spotify green with low opacity
    borderRadius: '8px',
    border: '1px solid rgba(29, 185, 84, 0.3)',
  },
  playlistTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  playlistLink: {
    color: '#1DB954',
    textDecoration: 'none',
    fontWeight: '500',
    display: 'inline-block',
    marginTop: '0.5rem',
  },
  // New styles for audio features and insights
  trackDetails: {
    padding: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    marginTop: '0.5rem',
    overflow: 'hidden',
    maxHeight: '0',
    transition: 'max-height 0.3s ease, padding 0.3s ease',
  },
  trackDetailsOpen: {
    maxHeight: '1000px',
    padding: '0.75rem',
  },
  detailsButton: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    marginLeft: '0.5rem',
    borderRadius: '4px',
  },
  insightsContainer: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: 'rgba(255, 126, 95, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 126, 95, 0.3)',
  },
  insightTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  insightsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  insightItem: {
    padding: '0.75rem',
    marginBottom: '0.75rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    lineHeight: '1.5',
  },
  moodFeatures: {
    marginTop: '1rem',
    marginBottom: '1.5rem',
  },
};

// Toggle Switch Component
const ToggleSwitch = ({ isOn, label, leftText, rightText, onToggle }) => {
  return (
    <div style={styles.optionLabel}>
      <span style={styles.switchLabel}>{label}</span>
      <div
        style={{
          ...styles.toggleButton,
          ...(isOn ? styles.toggleButtonActive : styles.toggleButtonInactive),
        }}
        onClick={onToggle}
      >
        <div
          style={{
            ...styles.toggleSlider,
            ...(isOn ? styles.toggleSliderActive : styles.toggleSliderInactive),
          }}
        />
        <span
          style={{
            ...styles.toggleText,
            ...styles.toggleTextOff,
            opacity: isOn ? 0 : 1,
          }}
        >
          {leftText}
        </span>
        <span
          style={{
            ...styles.toggleText,
            ...styles.toggleTextOn,
            opacity: isOn ? 1 : 0,
          }}
        >
          {rightText}
        </span>
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  
  // Authentication and user state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [topTracks, setTopTracks] = useState([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  
  // Toggle states
  const [moodMode, setMoodMode] = useState(true);
  const [playlistMode, setPlaylistMode] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customStory, setCustomStory] = useState('');
  const [customInputFocused, setCustomInputFocused] = useState(false);
  
  // Recommendations state
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationStory, setRecommendationStory] = useState('');
  const [generatedPlaylist, setGeneratedPlaylist] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [audioFeaturesData, setAudioFeaturesData] = useState(null);
  
  // Check for authorization code in URL when page loads
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');
    const errorParam = queryParams.get('error');
    
    if (errorParam) {
      setError(errorParam.replace(/_/g, ' '));
    }
    
    // If we have a code, exchange it for an access token
    if (code) {
      exchangeCodeForToken(code);
    }
    
    // Check if we already have a token in localStorage
    const storedToken = localStorage.getItem('spotify_access_token');
    const tokenExpiry = localStorage.getItem('spotify_token_expiry');
    
    if (storedToken && tokenExpiry && Number(tokenExpiry) > Date.now()) {
      setAccessToken(storedToken);
      setIsLoggedIn(true);
      fetchUserProfile(storedToken);
    }
  }, []);
  
  // Fetch user's top tracks when accessToken changes
  useEffect(() => {
    if (accessToken) {
      fetchTopTracks();
    }
  }, [accessToken]);
  
// In your page.js where you exchange the code for a token
const exchangeCodeForToken = async (code) => {
  try {
    console.log('Exchanging code for token...');
    
    const response = await fetch('/api/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Not JSON - try to get text content for debugging
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
      // Store token and expiry
      console.log('Token received successfully');
      localStorage.setItem('spotify_access_token', data.access_token);
      
      // Set expiry 1 hour from now (or use expires_in from response)
      const expiryTime = Date.now() + (data.expires_in * 1000);
      localStorage.setItem('spotify_token_expiry', expiryTime.toString());
      
      setAccessToken(data.access_token);
      setIsLoggedIn(true);
      fetchUserProfile(data.access_token);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, '/');
    } else {
      console.error('No access token in response:', data);
      setError('Failed to receive access token from Spotify');
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    setError('An error occurred during authentication');
  }
};
  const fetchUserProfile = async (token) => {
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
        // If we get an unauthorized response, the token is invalid
        if (response.status === 401) {
          handleLogout();
        }
        const errorData = await response.json();
        console.error('Failed to fetch user profile:', errorData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  const fetchTopTracks = async () => {
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
        // If we get an unauthorized response, the token is invalid
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
  };
  
  const handleLogin = () => {
    // Navigate programmatically to the login API route
    window.location.href = '/api/login';
  };
  
  const [expandedTrackId, setExpandedTrackId] = useState(null);
  
  const toggleTrackDetails = (trackId) => {
    if (expandedTrackId === trackId) {
      setExpandedTrackId(null);
    } else {
      setExpandedTrackId(trackId);
    }
  };
  
  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
    setAccessToken('');
    setIsLoggedIn(false);
    setUserData(null);
    setTopTracks([]);
    // Clear recommendations
    setRecommendations([]);
    setRecommendationStory('');
    setGeneratedPlaylist(null);
    setAiInsights([]);
    setAudioFeaturesData(null);
  };
  
  // Update this function in your Home component

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
    
    try {
      // Get the current token directly (this should be the most up-to-date)
      if (!accessToken) {
        throw new Error('No access token available. Please reconnect to Spotify.');
      }
      
      console.log('Fetching recommendations with prompt:', prompt);
      
      // First, get recommendations
      const recommendationResponse = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          token: accessToken,
          customStory: customMode ? customStory : '',
          seedTracks: topTracks.map(track => track.id) // Use all top tracks as seeds for better matching
        }),
      });
      
      console.log('Recommendation API response status:', recommendationResponse.status);
      
      if (!recommendationResponse.ok) {
        let errorMessage = `Failed to generate recommendations: ${recommendationResponse.status} ${recommendationResponse.statusText}`;
        
        try {
          // Try to parse the error as JSON first
          const errorData = await recommendationResponse.json();
          if (errorData && errorData.error) {
            errorMessage = `Error: ${errorData.error}`;
          }
        } catch (jsonError) {
          // If JSON parsing fails, try to get the text
          try {
            const errorText = await recommendationResponse.text();
            console.error('Recommendation API error response:', errorText);
          } catch (textError) {
            // If both fail, just use the status
            console.error('Could not parse error response');
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const recommendationData = await recommendationResponse.json();
      
      if (!recommendationData.recommendations || recommendationData.recommendations.length === 0) {
        setError('No recommendations found. Try a different mood.');
        setIsGenerating(false);
        return;
      }
      
      // Set initial recommendation state
      setAudioFeaturesData(recommendationData.audioFeatures || null);
      setRecommendations(recommendationData.recommendations || []);
      setRecommendationStory(recommendationData.story || '');
      
      // Now, get AI insights for the recommendations
      try {
        const aiResponse = await fetch('/api/ai-recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            token: accessToken,
            topTracks: topTracks,
            recommendedTracks: recommendationData.recommendations || [],
            audioFeatures: recommendationData.audioFeatures || {},
            mood: recommendationData.mood || 'balanced'
          }),
        });
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          
          // Use AI data to enhance recommendations
          if (aiData.story) setRecommendationStory(aiData.story);
          if (aiData.insightfulComments) setAiInsights(aiData.insightfulComments);
        }
      } catch (aiError) {
        console.error('Error enhancing with AI:', aiError);
        // Continue with standard recommendations
      }
      
      // Create playlist if needed
      if (playlistMode && recommendationData.recommendations && recommendationData.recommendations.length > 0) {
        try {
          const playlistResponse = await fetch('/api/recommendations', {
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
          });
          
          if (playlistResponse.ok) {
            const playlistData = await playlistResponse.json();
            if (playlistData.playlist) {
              setGeneratedPlaylist(playlistData.playlist);
            }
          }
        } catch (playlistError) {
          console.error('Error creating playlist:', playlistError);
        }
      }
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setError(error.message || 'Failed to generate recommendations');
      setRecommendations([]);
      setRecommendationStory('');
      setAiInsights([]);
      setAudioFeaturesData(null);
    } finally {
      setIsGenerating(false);
    }
  }

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
        
        <div style={styles.navRight}>
          {isLoggedIn && userData ? (
            <div style={styles.userProfile}>
              <span style={styles.userName}>
                {userData.display_name}
              </span>
              {userData.images && userData.images.length > 0 ? (
                <Image 
                  src={userData.images[0].url} 
                  alt="User Avatar" 
                  width={32} 
                  height={32} 
                  style={styles.userAvatar}
                  unoptimized={true} // Add this line to bypass image optimization
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#1DB954',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                }}>
                  {userData.display_name ? userData.display_name[0].toUpperCase() : 'U'}
                </div>
              )}
              <button 
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: '2rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
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
      
      <main style={styles.main}>
        <h1 style={styles.title}>Generate Music Based on Your Mood</h1>
        <p style={styles.description}>
          Describe how you're feeling or what vibe you're looking for, and we'll create the perfect playlist
        </p>
        
        {error && (
          <p style={styles.error}>Error: {error}</p>
        )}

        <div style={styles.settingsSection}>
          <h2 style={styles.sectionTitle}>Settings</h2>
          <div style={styles.switchesContainer}>
            <div style={styles.switchRow}>
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
            </div>
            
            <div style={styles.switchRow}>
              <ToggleSwitch 
                isOn={customMode} 
                label="Story Style" 
                leftText="Classic"
                rightText="Custom"
                onToggle={() => setCustomMode(!customMode)} 
              />
              
              {customMode && (
                <div style={{ marginTop: '0.75rem' }}>
                  <input
                    id="custom-story"
                    type="text"
                    placeholder="e.g., 'A traveler discovering new sounds...'"
                    value={customStory}
                    onChange={(e) => setCustomStory(e.target.value)}
                    onFocus={() => setCustomInputFocused(true)}
                    onBlur={() => setCustomInputFocused(false)}
                    style={{
                      ...styles.customInput,
                      ...(customInputFocused ? styles.customInputFocus : {})
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.inputContainer}>
          <label style={styles.promptLabel} htmlFor="mood-prompt">
            Enter your mood or vibe
          </label>
          <input
            id="mood-prompt"
            type="text"
            placeholder="e.g., 'Upbeat music for a morning workout' or 'Calm piano for reading'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              ...styles.promptInput,
              ...(inputFocused ? styles.promptInputFocus : {})
            }}
          />
          
          <button
            onClick={generateRecommendations}
            disabled={!isLoggedIn || !prompt || isGenerating}
            onMouseEnter={() => setButtonHover(true)}
            onMouseLeave={() => setButtonHover(false)}
            style={{
              ...styles.button,
              ...(buttonHover && !isGenerating && isLoggedIn && prompt ? styles.buttonHover : {}),
              ...(!isLoggedIn || !prompt || isGenerating ? styles.buttonDisabled : {})
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Recommendations'}
          </button>
        </div>
        
        {/* Display top tracks section if logged in */}
        {isLoggedIn && (
          <div style={styles.topTracksSection}>
            <h2 style={styles.sectionTitle}>Your Top Tracks</h2>
            
            {isLoadingTracks ? (
              <p style={styles.loadingIndicator}>Loading your top tracks...</p>
            ) : topTracks.length > 0 ? (
              <ul style={styles.tracksList}>
                {topTracks.map((track, index) => (
                  <li key={track.id} style={styles.trackItem}>
                    <span style={styles.trackNumber}>{index + 1}</span>
                    {track.album.images && track.album.images.length > 0 && (
                      // Option 1: Using next/image (requires next.config.js setup)
                      <Image 
                        src={track.album.images[2].url} 
                        alt={track.album.name}
                        width={40}
                        height={40}
                        style={styles.trackImage}
                        unoptimized={true} // Add this line to bypass image optimization
                      />
                      
                      // Option 2: Using regular img tag (uncomment to use this instead)
                      /* <img 
                        src={track.album.images[2].url} 
                        alt={track.album.name}
                        width={40}
                        height={40}
                        style={styles.trackImage}
                      /> */
                    )}
                    <div style={styles.trackInfo}>
                      <div style={styles.trackName}>{track.name}</div>
                      <div style={styles.trackArtist}>
                        {track.artists.map(artist => artist.name).join(', ')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={styles.loadingIndicator}>No top tracks found. Try listening to more music on Spotify!</p>
            )}
          </div>
        )}
        
        {/* Display recommendations if available */}
        {recommendations.length > 0 && (
          <div style={styles.recommendationsSection}>
            <h2 style={styles.sectionTitle}>Your Personalized Recommendations</h2>
            
            {/* Display audio features target for the mood */}
            {audioFeaturesData && (
              <div style={styles.moodFeatures}>
                <h3 style={{fontSize: '1rem', marginBottom: '0.5rem'}}>Target Audio Profile</h3>
                <AudioFeaturesDisplay features={audioFeaturesData} />
              </div>
            )}
            
            {recommendationStory && (
              <div style={styles.storyText}>
                {recommendationStory}
              </div>
            )}
            
            <ul style={styles.recommendationsList}>
              {recommendations.map((track, index) => (
                <li key={track.id} style={styles.trackItem}>
                  <span style={styles.trackNumber}>{index + 1}</span>
                  {track.album.images && track.album.images.length > 0 && (
                    // Option 1: Using next/image with unoptimized flag
                    <Image 
                      src={track.album.images[2].url} 
                      alt={track.album.name}
                      width={40}
                      height={40}
                      style={styles.trackImage}
                      unoptimized={true} // Add this line to bypass image optimization
                    />
                  )}
                  <div style={styles.trackInfo}>
                    <div style={styles.trackName}>
                      {track.name}
                      <button 
                        onClick={() => toggleTrackDetails(track.id)}
                        style={styles.detailsButton}
                      >
                        {expandedTrackId === track.id ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>
                    <div style={styles.trackArtist}>
                      {track.artists.map(artist => artist.name).join(', ')}
                    </div>
                    
                    {/* Track details section with audio features */}
                    <div 
                      style={{
                        ...styles.trackDetails,
                        ...(expandedTrackId === track.id ? styles.trackDetailsOpen : {})
                      }}
                    >
                      {track.audioFeatures && (
                        <AudioFeaturesDisplay features={track.audioFeatures} />
                      )}
                      
                      {/* Lyrics sentiment (if available) */}
                      {track.lyricsInfo && (
                        <div style={{marginTop: '0.5rem'}}>
                          <div style={{fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem'}}>
                            Lyrics Sentiment
                          </div>
                          <div style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: '4px',
                            display: 'inline-block',
                            backgroundColor: track.lyricsInfo.sentiment === 'positive' 
                              ? 'rgba(29, 185, 84, 0.2)' 
                              : 'rgba(255, 85, 85, 0.2)',
                            color: track.lyricsInfo.sentiment === 'positive'
                              ? '#1DB954'
                              : '#ff5555',
                            fontSize: '0.8rem'
                          }}>
                            {track.lyricsInfo.sentiment.charAt(0).toUpperCase() + track.lyricsInfo.sentiment.slice(1)}
                          </div>
                          
                          {track.lyricsInfo.themes && track.lyricsInfo.themes.length > 0 && (
                            <div style={{marginTop: '0.5rem'}}>
                              <div style={{fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem'}}>
                                Themes
                              </div>
                              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.3rem'}}>
                                {track.lyricsInfo.themes.map((theme, i) => (
                                  <span key={i} style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '20px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    fontSize: '0.7rem'
                                  }}>
                                    {theme}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Spotify player link */}
                      <div style={{marginTop: '0.5rem', textAlign: 'right'}}>
                        <a 
                          href={track.external_urls.spotify} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: '#1DB954',
                            fontSize: '0.8rem',
                            textDecoration: 'none'
                          }}
                        >
                          Play on Spotify
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* AI Insights */}
            {aiInsights && aiInsights.length > 0 && (
              <div style={styles.insightsContainer}>
                <div style={styles.insightTitle}>AI Music Insights</div>
                <ul style={styles.insightsList}>
                  {aiInsights.map((insight, index) => (
                    <li key={index} style={styles.insightItem}>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {generatedPlaylist && (
              <div style={styles.playlistInfo}>
                <div style={styles.playlistTitle}>
                  Playlist Created: {generatedPlaylist.name}
                </div>
                <p>{generatedPlaylist.description}</p>
                <a 
                  href={generatedPlaylist.external_urls.spotify} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.playlistLink}
                >
                  Open in Spotify
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}