// Updated styles.js with improved mobile responsiveness

export const styles = {
  // Container and Layout
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFF2',
    color: '#7A7687',
  },

  // Navigation Styles - Enhanced mobile support
  navbar: {
    width: '100%',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#C7C1DB',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    '@media (maxWidth: 768px)': {
      padding: '1rem',
      flexWrap: 'wrap',
    },
  },

  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },

  logoText: {
    fontSize: '2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, #f9b42a, #e7e789)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    '@media (maxWidth: 768px)': {
      fontSize: '1.5rem',
    },
  },

  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    '@media (maxWidth: 768px)': {
      display: 'none',
    },
  },

  navRightMobile: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#C7C1DB',
    flexDirection: 'column',
    padding: '1rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderRadius: '0 0 12px 12px',
    width: '250px',
    display: 'flex',
  },

  mobileMenuButton: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#7A7687',
    cursor: 'pointer',
    padding: '0.5rem',
    '@media (maxWidth: 768px)': {
      display: 'block',
    },
  },

  mobileMenuButtonOpen: {
    color: '#73669F',
  },

  // User Profile
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    '@media (maxWidth: 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '0.5rem',
    },
  },

  userName: {
    fontWeight: '500',
    color: '#7A7687',
    '@media (maxWidth: 768px)': {
      textAlign: 'center',
    },
  },

  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    objectFit: 'cover',
    '@media (maxWidth: 768px)': {
      alignSelf: 'center',
    },
  },

  userAvatarPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1DB954',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    '@media (maxWidth: 768px)': {
      alignSelf: 'center',
    },
  },

  // Buttons
  spotifyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1.5rem',
    backgroundColor: '#E7E789',
    color: '#73669F',
    border: 'none',
    borderRadius: '2rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },

  logoutButton: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(231, 231, 137, 0.3)',
    color: '#E7E789',
    borderRadius: '2rem',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  },

  // Main Content - Enhanced mobile padding
  mainContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '3rem 1.5rem',
    width: '100%',
    '@media (maxWidth: 768px)': {
      padding: '1.5rem 1rem',
    },
  },

  heroSection: {
    textAlign: 'center',
    marginBottom: '3rem',
    '@media (maxWidth: 768px)': {
      marginBottom: '2rem',
    },
  },

  mainTitle: {
    fontSize: 'clamp(1.75rem, 5vw, 3rem)',
    lineHeight: 1.2,
    background: 'linear-gradient(135deg, #f6b127, #E7C889, #E7E789, #e5e53a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1rem',
  },

  mainDescription: {
    fontSize: 'clamp(0.9rem, 2vw, 1.25rem)',
    opacity: 0.9,
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.5,
  },

  // Error Message
  errorMessage: {
    backgroundColor: 'rgba(255, 85, 85, 0.1)',
    borderLeft: '4px solid #ff5555',
    color: '#ff5555',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    maxWidth: '100%',
    fontSize: '0.9rem',
    '@media (maxWidth: 768px)': {
      padding: '0.75rem',
      fontSize: '0.85rem',
    },
  },

  // Settings Section - Improved mobile layout
  settingsSection: {
    backgroundColor: 'rgba(0, 0, 255, 0.03)',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    '@media (maxWidth: 768px)': {
      padding: '1.5rem 1rem',
      borderRadius: '12px',
    },
  },

  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#7A7687',
    '@media (maxWidth: 768px)': {
      fontSize: '1.25rem',
      marginBottom: '1rem',
    },
  },

  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    '@media (maxWidth: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '1rem',
    },
  },

  // Toggle Switch - Mobile optimized
  toggleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '1rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    '@media (maxWidth: 768px)': {
      padding: '0.75rem',
    },
  },

  toggleLabel: {
    display: 'block',
    fontWeight: '500',
    marginBottom: '0.75rem',
    color: '#73669F',
    fontSize: '0.95rem',
  },

  toggleButton: {
    position: 'relative',
    width: '120px',
    height: '36px',
    borderRadius: '18px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    background: 'linear-gradient(90deg, #FFF4DD, #E7C889)',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },

  toggleButtonActive: {
    background: 'linear-gradient(90deg, #E8E6F0, #73669F)',
  },

  toggleSlider: {
    position: 'absolute',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'white',
    top: '4px',
    left: '4px',
    transition: 'transform 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },

  toggleSliderActive: {
    transform: 'translateX(84px)',
  },

  toggleText: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    transition: 'opacity 0.3s ease',
    userSelect: 'none',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  },

  toggleTextLeft: {
    left: '12px',
  },

  toggleTextRight: {
    right: '12px',
  },

  // Custom Story Input
  customStoryContainer: {
    gridColumn: '1 / -1',
  },

  customStoryInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    marginTop: '1rem',
    fontSize: '0.875rem',
    backgroundColor: 'rgba(115, 102, 159, 0.1)',
    color: '#7A7687',
    border: '1px solid rgba(199, 193, 219, 0.2)',
    borderRadius: '20px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },

  // Input Section
  inputSection: {
    marginBottom: '3rem',
    '@media (maxWidth: 768px)': {
      marginBottom: '2rem',
    },
  },

  inputContainer: {
    maxWidth: '600px',
    margin: '0 auto',
  },

  inputLabel: {
    display: 'block',
    fontSize: '1.125rem',
    fontWeight: '500',
    marginBottom: '1rem',
    textAlign: 'center',
    '@media (maxWidth: 768px)': {
      fontSize: '1rem',
    },
  },

  moodInput: {
    width: '100%',
    padding: '1rem 1.5rem',
    fontSize: '1.125rem',
    backgroundColor: 'rgba(0, 0, 255, 0.05)',
    color: '#7A7687',
    border: '2px solid rgba(0, 0, 255, 0.1)',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    '@media (maxWidth: 768px)': {
      padding: '0.75rem 1rem',
      fontSize: '1rem',
    },
  },

  samplePrompts: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '1rem',
    justifyContent: 'center',
  },

  samplePrompt: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    backgroundColor: 'rgba(231, 231, 137, 0.2)',
    color: '#73669F',
    border: '1px solid rgba(231, 231, 137, 0.3)',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '@media (maxWidth: 768px)': {
      padding: '0.4rem 0.8rem',
      fontSize: '0.8rem',
    },
  },

  generateButton: {
    display: 'block',
    margin: '2rem auto 0',
    padding: '1rem 2rem',
    fontSize: '1.125rem',
    fontWeight: '600',
    background: 'linear-gradient(90deg, #C7C1DB, #9E94BE)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(115, 102, 159, 0.2)',
    '@media (maxWidth: 768px)': {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      margin: '1.5rem auto 0',
    },
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    background: '#888',
  },

  // Tracks Section - Major mobile improvements
  tracksSection: {
    backgroundColor: 'rgba(0, 0, 255, 0.03)',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    '@media (maxWidth: 768px)': {
      padding: '1.5rem 1rem',
      borderRadius: '12px',
    },
  },

  loadingSpinner: {
    textAlign: 'center',
    padding: '2rem',
    color: 'rgba(122, 118, 135, 0.7)',
    '@media (maxWidth: 768px)': {
      padding: '1.5rem',
      fontSize: '0.9rem',
    },
  },

  tracksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    '@media (maxWidth: 768px)': {
      gap: '0.75rem',
    },
  },

  // Track Card - Completely redesigned for mobile
  trackCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    '@media (maxWidth: 768px)': {
      padding: '0.75rem',
      borderRadius: '10px',
    },
  },

  trackCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    '@media (maxWidth: 768px)': {
      transform: 'none', // Disable hover effects on mobile
    },
  },

  trackMain: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    '@media (maxWidth: 768px)': {
      flexDirection: 'column',
      gap: '0.75rem',
    },
  },

  trackNumber: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'rgba(122, 118, 135, 0.5)',
    minWidth: '30px',
    textAlign: 'center',
    '@media (maxWidth: 768px)': {
      position: 'absolute',
      top: '0.75rem',
      left: '0.75rem',
      fontSize: '1rem',
      minWidth: 'auto',
    },
  },

  // Mobile track header container
  trackHeader: {
    '@media (maxWidth: 768px)': {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      width: '100%',
      paddingLeft: '2rem', // Make room for track number
    },
  },

  trackImageContainer: {
    flexShrink: 0,
    '@media (maxWidth: 768px)': {
      flexShrink: 0,
    },
  },

  trackImage: {
    borderRadius: '8px',
    objectFit: 'cover',
    '@media (maxWidth: 768px)': {
      width: '50px',
      height: '50px',
      borderRadius: '6px',
    },
  },

  trackInfo: {
    flex: 1,
    minWidth: 0,
    '@media (maxWidth: 768px)': {
      flex: 1,
      minWidth: 0,
    },
  },

  trackName: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '@media (maxWidth: 768px)': {
      fontSize: '0.9rem',
      whiteSpace: 'normal',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      lineHeight: 1.3,
      marginBottom: '0.1rem',
    },
  },

  trackArtist: {
    fontSize: '0.875rem',
    color: 'rgba(122, 118, 135, 0.7)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '@media (maxWidth: 768px)': {
      fontSize: '0.8rem',
      whiteSpace: 'normal',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
    },
  },

  detailsToggle: {
    background: 'none',
    border: 'none',
    color: '#73669F',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    marginTop: '0.25rem',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    '@media (maxWidth: 768px)': {
      fontSize: '0.7rem',
      padding: '0.2rem 0.4rem',
    },
  },

  trackActions: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0,
    '@media (maxWidth: 768px)': {
      width: '100%',
      justifyContent: 'space-between',
      gap: '0.5rem',
      marginTop: '0.5rem',
    },
  },

  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    border: 'none',
    whiteSpace: 'nowrap',
    '@media (maxWidth: 768px)': {
      flex: 1,
      justifyContent: 'center',
      padding: '0.6rem 0.75rem',
      fontSize: '0.8rem',
      gap: '0.3rem',
    },
  },

  buttonText: {
    display: 'inline-block',
    '@media (maxWidth: 480px)': {
      display: 'none', // Hide text on very small screens, keep only icons
    },
  },

  storyButton: {
    backgroundColor: 'rgba(231, 231, 137, 0.2)',
    color: '#73669F',
  },

  spotifyPlayButton: {
    backgroundColor: '#1DB954',
    color: 'white',
  },

  trackDetails: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
    '@media (maxWidth: 768px)': {
      marginTop: '0.75rem',
      paddingTop: '0.75rem',
    },
  },

  // Lyrics Info
  lyricsInfo: {
    marginTop: '1rem',
    '@media (maxWidth: 768px)': {
      marginTop: '0.75rem',
    },
  },

  lyricsSentiment: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    '@media (maxWidth: 768px)': {
      flexWrap: 'wrap',
      gap: '0.3rem',
    },
  },

  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#73669F',
    '@media (maxWidth: 768px)': {
      fontSize: '0.8rem',
    },
  },

  sentimentBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'capitalize',
    '@media (maxWidth: 768px)': {
      padding: '0.2rem 0.6rem',
      fontSize: '0.7rem',
    },
  },

  sentimentPositive: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    color: '#1DB954',
  },

  sentimentNegative: {
    backgroundColor: 'rgba(255, 85, 85, 0.2)',
    color: '#ff5555',
  },

  sentimentNeutral: {
    backgroundColor: 'rgba(122, 118, 135, 0.2)',
    color: '#7A7687',
  },

  lyricsThemes: {
    marginTop: '0.5rem',
  },

  themesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
    marginTop: '0.25rem',
  },

  themeTag: {
    padding: '0.25rem 0.5rem',
    backgroundColor: 'rgba(115, 102, 159, 0.1)',
    borderRadius: '12px',
    fontSize: '0.75rem',
    color: '#73669F',
    '@media (maxWidth: 768px)': {
      padding: '0.2rem 0.4rem',
      fontSize: '0.7rem',
    },
  },

  feedbackWrapper: {
    marginTop: '0.75rem',
    display: 'flex',
    justifyContent: 'flex-end',
    '@media (maxWidth: 768px)': {
      justifyContent: 'center',
      marginTop: '0.5rem',
    },
  },

  // Recommendations Section
  recommendationsSection: {
    backgroundColor: 'rgba(158, 148, 190, 0.05)',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    '@media (maxWidth: 768px)': {
      padding: '1.5rem 1rem',
      borderRadius: '12px',
    },
  },

  storyText: {
    fontStyle: 'italic',
    lineHeight: '1.6',
    padding: '1.5rem',
    backgroundColor: 'rgba(158, 148, 190, 0.1)',
    borderRadius: '12px',
    marginBottom: '2rem',
    borderLeft: '4px solid #9E94BE',
    '@media (maxWidth: 768px)': {
      padding: '1rem',
      fontSize: '0.9rem',
      marginBottom: '1.5rem',
    },
  },

  moodFeatures: {
    backgroundColor: 'rgba(231, 231, 137, 0.1)',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '2rem',
    '@media (maxWidth: 768px)': {
      padding: '1rem',
      marginBottom: '1.5rem',
    },
  },

  // AI Insights
  insightsSection: {
    backgroundColor: 'rgba(231, 200, 137, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginTop: '2rem',
    '@media (maxWidth: 768px)': {
      padding: '1rem',
      marginTop: '1.5rem',
    },
  },

  insightsTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#73669F',
    '@media (maxWidth: 768px)': {
      fontSize: '1.1rem',
      marginBottom: '0.75rem',
    },
  },

  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    '@media (maxWidth: 768px)': {
      gap: '0.5rem',
    },
  },

  insightItem: {
    padding: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    '@media (maxWidth: 768px)': {
      padding: '0.75rem',
      fontSize: '0.85rem',
    },
  },

  // Playlist Info
  playlistSection: {
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginTop: '2rem',
    '@media (maxWidth: 768px)': {
      padding: '1rem',
      marginTop: '1.5rem',
    },
  },

  playlistTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#1DB954',
    '@media (maxWidth: 768px)': {
      fontSize: '1.1rem',
    },
  },

  playlistDescription: {
    marginBottom: '1rem',
    lineHeight: '1.6',
    '@media (maxWidth: 768px)': {
      fontSize: '0.9rem',
      marginBottom: '0.75rem',
    },
  },

  playlistActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    '@media (maxWidth: 768px)': {
      gap: '0.5rem',
    },
  },

  
};

