import React, { useState } from 'react';

const StoryModal = ({ lyrics, story, trackId, isLoadingLyrics, isLoadingStory, onClose }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  if (!trackId) {
    return null;
  }

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const renderLyricsSection = () => {
    if (isLoadingLyrics) {
      return (
        <div style={styles.loadingSection}>
          <h3 style={styles.sectionTitle}>歌詞</h3>
          <div style={styles.loadingText}>正在獲取歌詞...</div>
        </div>
      );
    }

    if (!lyrics) {
      return null;
    }

    const isError = lyrics.startsWith('錯誤') || lyrics.includes('無法') || lyrics.includes('Error');
    
    return (
      <div style={styles.lyricsSection}>
        <h3 style={styles.sectionTitle}>歌詞</h3>
        <div style={isError ? styles.errorContent : styles.lyricsContent}>
          {lyrics}
        </div>
      </div>
    );
  };

  const renderStorySection = () => {
    if (isLoadingStory) {
      return (
        <div style={styles.loadingSection}>
          <h3 style={styles.sectionTitle}>歌曲故事</h3>
          <div style={styles.loadingText}>正在生成故事...</div>
        </div>
      );
    }

    if (!story) {
      return null;
    }

    const isError = story.startsWith('錯誤') || story.includes('無法') || story.includes('Error');
    
    return (
      <div style={styles.storySection}>
        <h3 style={styles.sectionTitle}>歌曲故事</h3>
        <div style={isError ? styles.errorContent : styles.storyContent}>
          {story}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.modal}>
      <div
        style={{
          ...styles.modalContent,
          animation: isFadingOut ? 'fadeOut 0.3s ease-out' : 'fadeIn 0.3s ease-out',
        }}
      >
        <button style={styles.closeButton} onClick={handleClose}>
          Close
        </button>
        
        {/* Spotify 播放器嵌入 */}
        <div style={styles.spotifyPlayer}>
          <iframe
            src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="encrypted-media"
            title="Spotify Player"
            style={{ borderRadius: '8px' }}
          ></iframe>
        </div>

        {/* 歌詞區塊 - 在故事上方 */}
        {renderLyricsSection()}

        {/* 故事區塊 - 在歌詞下方 */}
        {renderStorySection()}
      </div>
    </div>
  );
};

const styles = {
  modal: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000',
  },
  modalContent: {
    position: 'relative',
    backgroundColor: '#FFFFDD',
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '85vh',
    overflowY: 'auto',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: '#E7C889',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '1rem',
    zIndex: 1001,
    marginBottom: '5px'
  },
  spotifyPlayer: {
    marginTop: '30px',
    marginBottom: '20px',
  },
  lyricsSection: {
    marginBottom: '25px',
    borderBottom: '2px solid #E7C889',
    paddingBottom: '20px',
  },
  storySection: {
    marginTop: '20px',
  },
  loadingSection: {
    marginBottom: '25px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  sectionTitle: {
    color: '#333',
    marginTop: '0',
    marginBottom: '15px',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    borderBottom: '2px solid #E7C889',
    paddingBottom: '8px',
  },
  lyricsContent: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    whiteSpace: 'pre-wrap',
    color: '#333',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    fontFamily: 'monospace',
    border: '1px solid #dee2e6',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  storyContent: {
    color: '#000',
    whiteSpace: 'pre-wrap',
    fontSize: '1rem',
    lineHeight: '1.7',
    padding: '10px 0',
  },
  errorContent: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #f5c6cb',
    whiteSpace: 'pre-wrap',
  },
  loadingText: {
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px',
  },
};

// 定義動畫效果
const globalStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}
`;

// 將動畫樣式插入到頁面中
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = globalStyles;
  document.head.appendChild(styleSheet);
}

export default StoryModal;