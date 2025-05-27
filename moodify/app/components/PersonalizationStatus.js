// components/PersonalizationStatus.js
"use client";
import { useState, useEffect } from 'react';

const styles = {
  container: {
    maxWidth: '800px',
    width: '100%',
    padding: '1rem',
    marginTop: '2rem',
    backgroundColor: 'rgba(0, 0, 255, 0.05)',
    borderRadius: '12px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#73669F',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  statusText: {
    fontSize: '1rem',
    color: '#7A7687',
  },
  statusValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#73669F',
  },
  progressContainer: {
    width: '100%',
    height: '12px',
    backgroundColor: 'rgba(115, 102, 159, 0.1)',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '1rem',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E7E789',
    backgroundImage: 'linear-gradient(90deg, #E7E789, #9E94BE)',
    borderRadius: '6px',
    transition: 'width 0.5s ease-in-out',
  },
  preferencesContainer: {
    marginTop: '1rem',
  },
  preferencesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  preferenceTag: {
    padding: '0.5rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '500',
    backgroundColor: 'rgba(231, 231, 137, 0.2)',
    color: '#73669F',
  },
  noPreferences: {
    fontSize: '0.9rem',
    fontStyle: 'italic',
    color: 'rgba(122, 118, 135, 0.7)',
  },
  feedbackButton: {
    padding: '0.75rem 1.25rem',
    backgroundColor: 'rgba(158, 148, 190, 0.2)',
    color: '#9E94BE',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '1rem',
  },
  feedbackButtonHover: {
    backgroundColor: 'rgba(158, 148, 190, 0.3)',
    transform: 'translateY(-2px)',
  },
  resetButton: {
    padding: '0.5rem 0.75rem',
    backgroundColor: 'rgba(231, 200, 137, 0.1)',
    color: '#E7C889',
    border: '1px solid rgba(231, 200, 137, 0.3)',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '1rem',
  },
  resetButtonHover: {
    backgroundColor: 'rgba(231, 200, 137, 0.2)',
  },
};

export default function PersonalizationStatus({ userId }) {
  const [personalization, setPersonalization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [buttonHover, setButtonHover] = useState(false);
  const [resetButtonHover, setResetButtonHover] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchPersonalizationData = async () => {
      setIsLoading(true);
      try {
        // Get user's personalization data
        const response = await fetch(`/api/user-personalization?userId=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          setPersonalization(data);
        }
        
        // Get feedback count
        const feedbackResponse = await fetch(`/api/feedback-count?userId=${userId}`);
        
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          setFeedbackCount(feedbackData.count);
        }
      } catch (error) {
        console.error('Error fetching personalization data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonalizationData();
  }, [userId]);

  const getPersonalizationLevel = () => {
    if (feedbackCount < 5) {
      return {
        level: 'Learning',
        percentage: Math.min(100, feedbackCount * 20),
        message: 'Starting to learn your preferences...'
      };
    } else if (feedbackCount < 15) {
      return {
        level: 'Basic',
        percentage: Math.min(100, 50 + (feedbackCount - 5) * 5),
        message: 'Building a basic understanding of your preferences'
      };
    } else {
      return {
        level: 'Advanced',
        percentage: 100,
        message: 'Highly personalized recommendations based on your feedback'
      };
    }
  };

  const getTopGenres = () => {
    if (!personalization || !personalization.likedGenres) {
      return [];
    }

    return Object.entries(personalization.likedGenres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);
  };

  const resetPersonalization = async () => {
    if (!window.confirm('Are you sure you want to reset your personalization data? This will delete all your feedback history.')) {
      return;
    }

    try {
      const response = await fetch('/api/reset-personalization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setPersonalization(null);
        setFeedbackCount(0);
        alert('Your personalization data has been reset.');
      } else {
        alert('Failed to reset personalization data. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting personalization:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Your Music Personalization</h2>
        <p style={styles.statusText}>Loading personalization data...</p>
      </div>
    );
  }

  const personalizationInfo = getPersonalizationLevel();
  const topGenres = getTopGenres();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Your Music Personalization</h2>
      
      <div style={styles.status}>
        <span style={styles.statusText}>Personalization Level:</span>
        <span style={styles.statusValue}>{personalizationInfo.level}</span>
      </div>
      
      <div style={styles.progressContainer}>
        <div 
          style={{
            ...styles.progressBar,
            width: `${personalizationInfo.percentage}%`
          }}
        />
      </div>
      
      <p style={styles.statusText}>{personalizationInfo.message}</p>
      
      <div style={styles.status}>
        <span style={styles.statusText}>Feedback Provided:</span>
        <span style={styles.statusValue}>{feedbackCount} songs</span>
      </div>
      
      {topGenres.length > 0 && (
        <div style={styles.preferencesContainer}>
          <h3 style={{...styles.statusText, fontWeight: '500', marginBottom: '0.5rem'}}>
            Your Top Genres:
          </h3>
          <div style={styles.preferencesList}>
            {topGenres.map(genre => (
              <span key={genre} style={styles.preferenceTag}>{genre}</span>
            ))}
          </div>
        </div>
      )}
      
      {feedbackCount < 5 && (
        <p style={styles.noPreferences}>
          Provide feedback on more songs to improve personalization.
        </p>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <button
          onClick={() => window.location.href = '#top-tracks'}
          onMouseEnter={() => setButtonHover(true)}
          onMouseLeave={() => setButtonHover(false)}
          style={{
            ...styles.feedbackButton,
            ...(buttonHover ? styles.feedbackButtonHover : {})
          }}
        >
          Provide More Feedback
        </button>
        
        {feedbackCount > 0 && (
          <button
            onClick={resetPersonalization}
            onMouseEnter={() => setResetButtonHover(true)}
            onMouseLeave={() => setResetButtonHover(false)}
            style={{
              ...styles.resetButton,
              ...(resetButtonHover ? styles.resetButtonHover : {})
            }}
          >
            Reset Personalization
          </button>
        )}
      </div>
    </div>
  );
}