// pages/index.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Spotify Auth Demo</h1>
        <p className={styles.description}>
          Connect your Spotify account to get started
        </p>

        <div className={styles.grid}>
          <Link href="/api/login">
            <div className={styles.card}>
              <h2>Login with Spotify &rarr;</h2>
              <p>Authorize this app to access your Spotify data.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}