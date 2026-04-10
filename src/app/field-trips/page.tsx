import { PublicShell } from "@/components/public/public-shell";
import { upcomingTrips } from "@/components/public/content";
import styles from "@/components/public/public-site.module.css";

export default function FieldTripsPage() {
  return (
    <PublicShell activePath="/field-trips">
      <section className={styles.section}>
        <h2 className={styles.sectionHeader}>Field Trips</h2>
        <div className={styles.sectionBody}>
          <p>
            Field trips are weather dependent. Please bring water, boots, gloves,
            and common sense. Families are welcome, but children should stay with
            an adult near ledges or quarry edges.
          </p>
          <ul className={styles.list}>
            {upcomingTrips.map((trip) => (
              <li key={trip}>{trip}</li>
            ))}
          </ul>
        </div>
      </section>
    </PublicShell>
  );
}
