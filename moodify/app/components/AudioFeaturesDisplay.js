// components/AudioFeaturesDisplay.js

import React from 'react';

const AudioFeaturesDisplay = ({ features }) => {
  if (!features) return null;
  
  // Define the features to display and their display names
  const featureConfig = {
    energy: { name: 'Energy', color: '#ff5555' },
    valence: { name: 'Positivity', color: '#55ff55' },
    danceability: { name: 'Danceability', color: '#ff55ff' },
    acousticness: { name: 'Acoustic', color: '#5555ff' },
    instrumentalness: { name: 'Instrumental', color: '#55ffff' },
  };
  
  // Create a formatted representation of each audio feature
  const renderFeatureBars = () => {
    return Object.entries(features)
      .filter(([key, value]) => 
        featureConfig[key.replace('target_', '')] && 
        typeof value === 'number' && 
        !isNaN(value)
      )
      .map(([key, value]) => {
        // Remove 'target_' prefix if it exists
        const featureKey = key.replace('target_', '');
        const config = featureConfig[featureKey];
        
        if (!config) return null;
        
        // Scale for percentage display (0-100%)
        const percentage = Math.round(value * 100);
        
        return (
          <div key={key} style={{
            marginBottom: '0.5rem',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.2rem',
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <span>{config.name}</span>
              <span>{percentage}%</span>
            </div>
            <div style={{
              height: '0.3rem',
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: config.color,
                borderRadius: '2px',
              }} />
            </div>
          </div>
        );
      });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      gap: '0.2rem'
    }}>
      {renderFeatureBars()}
    </div>
  );
};

export default AudioFeaturesDisplay;