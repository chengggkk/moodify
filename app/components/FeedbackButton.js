// app/components/FeedbackButton.js (Fully fixed version for App Router)
"use client";
import { useState, useEffect } from 'react';

const styles = {
  feedbackContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '10px',
  },
  feedbackButtons: {
    display: 'flex',
    gap: '8px',
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
  },
  likeButton: {
    backgroundColor: 'rgba(231, 231, 137, 0.2)',
    color: '#E7E789',
  },
  likeButtonActive: {
    backgroundColor: 'rgba(231, 231, 137, 0.8)',
    color: '#73669F',
  },
  dislikeButton: {
    backgroundColor: 'rgba(231, 200, 137, 0.2)',
    color: '#E7C889',
  },
  dislikeButtonActive: {
    backgroundColor: 'rgba(231, 200, 137, 0.8)',
    color: '#73669F',
  },
  feedbackSuccess: {
    fontSize: '0.75rem',
    color: '#9E94BE',
    marginTop: '4px',
    fontStyle: 'italic',
  }
};

export default function FeedbackButton({ trackId, userId, onFeedbackSubmitted }) {
  const [feedbackState, setFeedbackState] = useState('none'); // 'none', 'like', 'dislike'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check for existing feedback when component mounts
  useEffect(() => {
    const checkExistingFeedback = async () => {
      if (!trackId || !userId) return;
      
      try {
        // Modified for App Router - no need to add query params to URL directly
        const response = await fetch(`/api/check-feedback?userId=${userId}&trackId=${trackId}`);
        
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
    
    if (userId && trackId) {
      checkExistingFeedback();
    }
  }, [trackId, userId]);

  const submitFeedback = async (feedback) => {
    // Don't allow submitting the same feedback twice or if already submitting
    if (feedbackState === feedback || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(''); // Clear any previous errors
    
    try {
      // Create a simple payload with essential data
      const payload = {
        userId,
        trackId,
        feedback,
        timestamp: new Date().toISOString()
      };
      
      console.log('Submitting feedback:', payload);
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Success path
        setFeedbackState(feedback);
        setSuccessMessage('Feedback saved!');
        setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
        
        // Call the callback function if it exists
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(trackId, feedback);
        }
      } else {
        // Error path with detailed logging
        console.error('HTTP Error submitting feedback. Status:', response.status, response.statusText);
        
        // Try to get error details
        let errorDetails = 'No details available';
        
        // First check if there's any content to parse
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
          } else {
            errorDetails = await response.text() || 'Empty response';
          }
        } catch (parseError) {
          errorDetails = `Response parsing error: ${parseError.message}`;
        }
        
        // Set error state for UI
        setErrorMessage(`Error: ${errorDetails}`);
        console.error('Error submitting feedback:', errorDetails);
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
      <div style={styles.feedbackButtons}>
        <button
          onClick={() => submitFeedback('like')}
          disabled={isSubmitting}
          style={{
            ...styles.feedbackButton,
            ...(feedbackState === 'like' ? styles.likeButtonActive : styles.likeButton),
            ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
          }}
          aria-label="Like"
        >
          👍 Like
        </button>
        <button
          onClick={() => submitFeedback('dislike')}
          disabled={isSubmitting}
          style={{
            ...styles.feedbackButton,
            ...(feedbackState === 'dislike' ? styles.dislikeButtonActive : styles.dislikeButton),
            ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
          }}
          aria-label="Dislike"
        >
          👎 Dislike
        </button>
      </div>
      
      {successMessage && (
        <div style={styles.feedbackSuccess}>{successMessage}</div>
      )}
      
      {errorMessage && (
        <div style={{
          fontSize: '0.75rem',
          color: '#ff5555',
          marginTop: '4px',
          fontStyle: 'italic',
        }}>
          {errorMessage}
        </div>
      )}
      
      {isSubmitting && (
        <div style={{
          fontSize: '0.75rem',
          color: '#73669F',
          marginTop: '4px',
          fontStyle: 'italic',
        }}>
          Sending feedback...
        </div>
      )}
    </div>
  );
}