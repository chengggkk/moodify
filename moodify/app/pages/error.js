// pages/error.js
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Error() {
  const router = useRouter();
  const { error } = router.query;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Authentication Error</h1>
        <p className={styles.description}>
          Error: {error || 'Unknown error occurred'}
        </p>
        <Link href="/">
          <div className={styles.card}>
            <h2>Back to Home &rarr;</h2>
            <p>Try logging in again.</p>
          </div>
        </Link>
      </main>
    </div>
  );
}