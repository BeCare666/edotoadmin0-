import styles from './page-loader.module.css';

// Écran de chargement : emblème E.doto (le même que sur le site), nom et barre de progression
export default function PageLoader() {
  return (
    <div className={styles.loaderContainer} role="status" aria-live="polite">
      <img src="/logo/edoto-emblem.png" alt="E.doto family" className={styles.logo} />
      <p className={styles.brand}>
        E.doto <span>family</span>
      </p>
      <div className={styles.bar} aria-hidden="true">
        <span />
      </div>
      <span className={styles.srOnly}>Chargement…</span>
    </div>
  );
}
