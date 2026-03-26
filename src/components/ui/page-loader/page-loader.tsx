import styles from './page-loader.module.css';

export default function PageLoader() {
  return (
    <div className={styles.loaderContainer}>
      <img
        src="https://edotofamily.netlify.app/images/edotofamily6.1.png"
        alt="logo"
        className={styles.logo}
      />
       
      <p className={styles.textspin}></p>
      <p className={styles.textspin}></p>
      <p className={styles.textspin}></p>
      <div className={styles.dots}>
 
      </div>
    </div>
  );
}