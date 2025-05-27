import React, { useState, useEffect } from 'react';

// Enhanced Progress Display Component
const EnhancedProgressDisplay = ({ requestId, isGenerating, onComplete, onError }) => {
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Icons for different states
  const StatusIcons = {
    completed: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-green-500">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
      </svg>
    ),
    active: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="animate-spin text-blue-500">
        <path opacity="0.3" d="M8 1a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5V1z"/>
        <path d="M8 1v2a5 5 0 0 1 5 5h2a7 7 0 0 0-7-7z"/>
      </svg>
    ),
    error: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-red-500">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
      </svg>
    ),
    pending: () => (
      <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-opacity-30"></div>
    )
  };

  // Fetch progress data
  const fetchProgress = async () => {
    if (!requestId) return;

    try {
      const response = await fetch(`/api/recommendations/status?requestId=${requestId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
        setLastUpdate(new Date());
        
        // Handle completion
        if (data.status === 'completed' && onComplete) {
          onComplete(data.result);
        }
        
        // Handle errors
        if (data.status === 'error' && onError) {
          onError(data.error);
        }
      } else if (response.status === 404) {
        // Progress not found - might be too early or expired
        console.log('Progress data not found, retrying...');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch progress');
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Network error while fetching progress');
    }
  };

  // Poll for progress updates
  useEffect(() => {
    if (!requestId || !isGenerating) return;

    // Initial fetch
    fetchProgress();

    // Set up polling
    const interval = setInterval(fetchProgress, 1000); // Poll every second

    return () => clearInterval(interval);
  }, [requestId, isGenerating]);

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return '';
    const seconds = Math.round(ms / 1000);
    return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  // Format time remaining
  const formatTimeRemaining = (ms) => {
    if (!ms) return '';
    const seconds = Math.round(ms / 1000);
    return `~${seconds}s remaining`;
  };

  if (error) {
    return (
      <div className="progress-container error">
        <div className="progress-header">
          <StatusIcons.error />
          <h3>Error fetching progress</h3>
        </div>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!progressData && isGenerating) {
    return (
      <div className="progress-container">
        <div className="progress-header">
          <StatusIcons.active />
          <h3>Initializing...</h3>
        </div>
        <p>Setting up your personalized music recommendation...</p>
      </div>
    );
  }

  if (!progressData) return null;

  const { steps = [], status, currentStep, progress, timing } = progressData;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <div className="progress-title-section">
          {status === 'completed' ? <StatusIcons.completed /> : 
           status === 'error' ? <StatusIcons.error /> : 
           <StatusIcons.active />}
          <h3>
            {status === 'completed' ? 'Recommendations Ready!' :
             status === 'error' ? 'Processing Error' :
             'Generating Your Personalized Recommendations...'}
          </h3>
        </div>
        
        {progress && (
          <div className="progress-stats">
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="progress-text">
                {progress.percentage}% ({progress.completedSteps}/{progress.totalSteps})
              </span>
            </div>
            
            {progress.estimatedTimeRemaining && status === 'active' && (
              <div className="time-estimate">
                {formatTimeRemaining(progress.estimatedTimeRemaining)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="steps-container">
        {steps.map((step, index) => {
          const isActive = currentStep === step.name;
          const isCompleted = step.completed;
          const isError = step.status === 'error';
          const isPending = !isCompleted && !isActive && status === 'active';

          return (
            <div
              key={step.name}
              className={`step-item ${
                isError ? 'error' : 
                isCompleted ? 'completed' : 
                isActive ? 'active' : 
                'pending'
              }`}
            >
              <div className="step-indicator">
                <div className="step-icon">
                  {isError ? <StatusIcons.error /> :
                   isCompleted ? <StatusIcons.completed /> :
                   isActive ? <StatusIcons.active /> :
                   <StatusIcons.pending />}
                </div>
                {step.icon && (
                  <div className="step-emoji">{step.icon}</div>
                )}
              </div>

              <div className="step-content">
                <div className="step-label">
                  {step.label || step.name}
                  {step.duration && (
                    <span className="step-duration">
                      {formatDuration(step.duration)}
                    </span>
                  )}
                </div>
                
                {step.message && (
                  <div className="step-message">{step.message}</div>
                )}
                
                {step.result && (
                  <div className="step-result">{step.result}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {timing && (
        <div className="progress-footer">
          <div className="timing-info">
            {status === 'completed' ? (
              <span>✅ Completed in {formatDuration(timing.totalDuration)}</span>
            ) : (
              <span>⏱️ Running for {formatDuration(timing.totalDuration)}</span>
            )}
            {lastUpdate && (
              <span className="last-update">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .progress-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
          color: white;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .progress-container.error {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        }

        .progress-header {
          margin-bottom: 20px;
        }

        .progress-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .progress-title-section h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .progress-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-bar-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.875rem;
          font-weight: 500;
          min-width: 80px;
        }

        .time-estimate {
          font-size: 0.875rem;
          opacity: 0.9;
          text-align: center;
        }

        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 12px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .step-item.active {
          background: rgba(255, 255, 255, 0.15);
          border-left: 3px solid rgba(255, 255, 255, 0.8);
        }

        .step-item.completed {
          background: rgba(255, 255, 255, 0.1);
          opacity: 0.8;
        }

        .step-item.error {
          background: rgba(255, 255, 255, 0.1);
          border-left: 3px solid #ff4757;
        }

        .step-item.pending {
          opacity: 0.6;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 40px;
        }

        .step-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-emoji {
          font-size: 1.125rem;
        }

        .step-content {
          flex: 1;
        }

        .step-label {
          font-weight: 500;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .step-duration {
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .step-message {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 2px;
        }

        .step-result {
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }

        .progress-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .timing-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .last-update {
          font-style: italic;
        }

        .error-message {
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .progress-container {
            padding: 16px;
            margin: 16px 0;
          }

          .timing-info {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }

          .progress-bar-container {
            flex-direction: column;
            gap: 8px;
          }

          .progress-text {
            text-align: center;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedProgressDisplay;