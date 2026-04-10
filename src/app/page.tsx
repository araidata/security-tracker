import Image from "next/image";
import { PublicShell } from "@/components/public/public-shell";
import {
  clubNews,
  identificationTips,
  recentFinds,
  upcomingTrips,
} from "@/components/public/content";
import styles from "@/components/public/public-site.module.css";

export default function Home() {
  return (
    <PublicShell activePath="/">
      <section className={styles.hero}>
        <h2>Welcome to Our Club Website</h2>
        <p>
          We are a small hobby club for people around Vermont who like rocks,
          fossils, gravel pit stories, and the occasional cold Saturday field trip.
          This website is mostly here for meeting notes, trip reminders, and some
          simple identification help. It is not fancy, but it does the job.
        </p>
      </section>

      <div className={styles.twoCol}>
        <div className={styles.mainCol}>
          <section className={styles.section}>
            <h3 className={styles.sectionHeader}>Recent Finds</h3>
            <div className={styles.sectionBody}>
              <div className={styles.thumbGrid}>
                {recentFinds.map((item) => (
                  <div key={item.caption} className={styles.thumbCard}>
                    <Image src={item.src} alt={item.alt} width={320} height={220} />
                    <div className={styles.thumbCaption}>{item.caption}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionHeader}>Rock Identification Tips</h3>
            <div className={styles.sectionBody}>
              <ul className={styles.list}>
                <li>Use the Mohs scale when you can, even just a rough scratch test.</li>
                <li>Check streak color before relying on outside color in daylight.</li>
                <li>Look at fracture, grain, and any crystal faces with a hand lens.</li>
                <li>Bring a magnet, a streak plate, and a notebook if you are serious.</li>
                {identificationTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionHeader}>Club News</h3>
            <div className={styles.sectionBody}>
              {clubNews.map((item) => (
                <div key={item} className={styles.newsItem}>
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.sideCol}>
          <section className={styles.section}>
            <h3 className={styles.sectionHeader}>Upcoming Field Trips</h3>
            <div className={styles.sectionBody}>
              <ul className={styles.list}>
                {upcomingTrips.map((trip) => (
                  <li key={trip}>{trip}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionHeader}>Members Only</h3>
            <div className={styles.sectionBody}>
              <p>
                Some meeting materials and specimen logs are limited to registered
                club members.
              </p>
              <p>Contact the club administrator if you need access help.</p>
            </div>
          </section>
        </aside>
      </div>
    </PublicShell>
  );
}
