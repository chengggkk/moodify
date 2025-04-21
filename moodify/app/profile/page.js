"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const styles = {
  container: {
    minHeight: '100vh',
    padding: '0 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  main: {
    padding: '5rem 0',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    lineHeight: 1.15,
    fontSize: '4rem',
    textAlign: 'center'
  },
  description: {
    textAlign: 'center',
    lineHeight: '1.5',
    fontSize: '1.5rem',
    margin: '1rem 0'
  },
  grid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: '800px',
    margin: '1.5rem 0'
  },
  card: {
    margin: '1rem',
    padding: '1.5rem',
    textAlign: 'left',
    color: 'inherit',
    textDecoration: 'none',
    border: '1px solid #eaeaea',
    borderRadius: '10px',
    transition: 'color 0.15s ease, border-color 0.15s ease',
    width: '300px'
  },
  profileImage: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    marginBottom: '1rem'
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#1DB954',
    color: 'white',
    border: 'none',
    borderRadius: '2rem',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem'
  },
  loading: {
    fontSize: '1.5rem',
    margin: '2rem'
  },
  error: {
    color: 'red',
    marginBottom: '1rem'
  }
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch the user profile
        const response = await fetch('/api/profile');
        const data = await response.json();

        if (response.ok) {
          setProfile(data);
        } else {
          // If unauthorized, redirect to login
          if (response.status === 401) {
            router.push('/');
          } else {
            setError(data.error || 'Failed to fetch profile');
          }
        }
      } catch (err) {
        setError('Error fetching profile data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout');
      router.push('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <main style={styles.main}>
          <div style={styles.loading}>Loading profile...</div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <h1 style={styles.title}>Your Spotify Profile</h1>
        
        {error && (
          <p style={styles.error}>{error}</p>
        )}

        {profile && (
          <div style={styles.grid}>
            <div style={styles.card}>
              {profile.images && profile.images[0] && (
                <img 
                  src={profile.images[0].url} 
                  alt={profile.display_name} 
                  style={styles.profileImage} 
                />
              )}
              <h2>{profile.display_name}</h2>
              <p>Email: {profile.email}</p>
              <p>Spotify ID: {profile.id}</p>
              <p>Followers: {profile.followers?.total || 0}</p>
              <p>Country: {profile.country}</p>
              {profile.product && (
                <p>Subscription: {profile.product}</p>
              )}
              <button style={styles.button} onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}