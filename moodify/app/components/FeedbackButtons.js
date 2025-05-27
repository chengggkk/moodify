// app/components/FeedbackButtons.js (Fixed version for App Router)
"use client";
import { useState, useEffect } from 'react';

const styles = {
  feedbackContainer: {
    display: 'flex',
    marginLeft: '10px',
    marginTop: '8px',
    alignItems: 'center',
  },
  feedbackButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    margin: '0 4px',
  },
  matchButton: {
    backgroundColor: 'rgba(231, 231, 137, 0.2)',
    color: '#E7E789',
  },
  matchButtonActive: {
    backgroundColor: 'rgba(231, 231, 137, 0.8)',
    color: '#73669F',
  },
  noMatchButton: {
    backgroundColor: 'rgba(231, 200, 137, 0.2)',
    color: '#E7C889',
  },
  noMatchButtonActive: {
    backgroundColor: 'rgba(231, 200, 137, 0.8)',
    color: '#73669F',
  },
  feedbackSuccess: {
    fontSize: '0.75rem',
    color: '#9E94BE',
    marginLeft: '8px',
    fontStyle: 'italic',
  },
  feedbackError: {
    fontSize: '0.75rem',
    color: '#ff5555',
    marginLeft: '8px',
    fontStyle: 'italic',
  },
  loadingIndicator: {
    fontSize: '0.75rem',
    color: '#73669F',
    marginLeft: '8px',
    fontStyle: 'italic',
  }
};

export default function FeedbackButtons({ trackId, userId, prompt }) {
  const [feedbackState, setFeedbackState] = useState(null); // null, 'match', 'no_match'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check for existing feedback when component mounts
  useEffect(() => {
    const checkExistingFeedback = async () => {
      if (!trackId || !userId || !prompt) return;
      
      try {
        const response = await fetch(`/api/song-feedback/check?userId=${userId}&trackId=${trackId}&prompt=${encodeURIComponent(prompt)}`);
        
        if (!response.ok) {
          console.warn(`Failed to check existing feedback: ${response.status}`);
          return;
        }
        
        const data = await response.json();
        if (data.feedback) {
          setFeedbackState(data.feedback);
        }
      } catch (error) {
        console.error('Error checking existing feedback:', error);
      }
    };
    
    if (userId && trackId && prompt) {
      checkExistingFeedback();
    }
  }, [trackId, userId, prompt]);

  const submitFeedback = async (feedback) => {
    // Don't allow submitting the same feedback twice or if already submitting
    if (feedbackState === feedback || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(''); // Clear any previous errors
    
    try {
      // Create payload with all needed data
      const payload = {
        userId,
        trackId,
        feedback, // 'match' or 'no_match'
        prompt,
        timestamp: new Date().toISOString()
      };
      
      console.log('Submitting song feedback:', payload);
      
      const response = await fetch('/api/song-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Log the raw response for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

      if (response.ok) {
        // Success path
        setFeedbackState(feedback);
        setSuccessMessage('感謝您的反饋!');
        setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
      } else {
        // Error path with detailed logging
        console.error('HTTP Error:', response.status, response.statusText);
        
        // Try to get error details
        let errorDetails = 'No details available';
        
        // First check if there's any content to parse
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
          } else {
            const textContent = await response.text();
            errorDetails = textContent || 'Empty response';
          }
        } catch (parseError) {
          errorDetails = `Response parsing error: ${parseError.message}`;
        }
        
        // Set error state for UI
        setErrorMessage(`Error: ${errorDetails}`);
        console.error('Error details:', errorDetails);
      }
    } catch (error) {
      // Network or other client-side errors
      console.error('Client error submitting feedback:', error);
      setErrorMessage(`Network error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.feedbackContainer}>
      <button
        onClick={() => submitFeedback('match')}
        disabled={isSubmitting}
        style={{
          ...styles.feedbackButton,
          ...(feedbackState === 'match' ? styles.matchButtonActive : styles.matchButton),
          ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
        }}
        aria-label="符合"
      >
        👍 符合
      </button>
      <button
        onClick={() => submitFeedback('no_match')}
        disabled={isSubmitting}
        style={{
          ...styles.feedbackButton,
          ...(feedbackState === 'no_match' ? styles.noMatchButtonActive : styles.noMatchButton),
          ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
        }}
        aria-label="不符合"
      >
        👎 不符合
      </button>
      
      {isSubmitting && (
        <div style={styles.loadingIndicator}>提交中...</div>
      )}
      
      {successMessage && !isSubmitting && (
        <div style={styles.feedbackSuccess}>{successMessage}</div>
      )}
      
      {errorMessage && !isSubmitting && (
        <div style={styles.feedbackError}>{errorMessage}</div>
      )}
    </div>
  );
}