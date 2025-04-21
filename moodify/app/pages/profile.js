// pages/profile.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import styles from '../styles/Home.module.css';

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/user-profile');
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        
        // Handle token expired error
        if (err.response?.status === 401) {
          try {
            // Try to refresh the token
            await axios.post('/api/refresh-token');
            // Retry fetching the profile
            const retryResponse = await axios.get('/api/user-profile');
            setProfile(retryResponse.data);
          } catch (refreshErr) {
            // If refresh fails, redirect to login
            console.error('Error refreshing token:', refreshErr);
            setError('Session expired. Please log in again.');
            setTimeout(() => {
              router.push('/');
            }, 2000);
          }
        } else {
          setError('Failed to load profile data.');
        }
        
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Loading...</h1>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Error</h1>
          <p className={styles.description}>{error}</p>
          <Link href="/">
            <div className={styles.card}>
              <h2>Back to Home &rarr;</h2>
            </div>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Profile</h1>
        {profile && (
          <div className={styles.card} style={{ maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              {profile.images && profile.images[0] && (
                <img
                  src={profile.images[0].url}
                  alt="Profile"
                  style={{ width: '80px', height: '80px', borderRadius: '50%' }}
                />
              )}
              <div>
                <h2>{profile.display_name}</h2>
                <p>{profile.email}</p>
              </div>
            </div>
            <div>
              <p><strong>ID:</strong> {profile.id}</p>
              <p><strong>Country:</strong> {profile.country}</p>
              <p><strong>Product:</strong> {profile.product}</p>
              <p><strong>Followers:</strong> {profile.followers?.total || 0}</p>
            </div>
          </div>
        )}
        <Link href="/">
          <div className={styles.card}>
            <h2>Back to Home &rarr;</h2>
          </div>
        </Link>
      </main>
    </div>
  );
}