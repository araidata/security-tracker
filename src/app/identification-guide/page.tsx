import { PublicShell } from "@/components/public/public-shell";
import { identificationTips } from "@/components/public/content";
import styles from "@/components/public/public-site.module.css";

export default function IdentificationGuidePage() {
  return (
    <PublicShell activePath="/identification-guide">
      <section className={styles.section}>
        <h2 className={styles.sectionHeader}>Identification Guide</h2>
        <div className={styles.sectionBody}>
          <p>
            This is a basic club guide only. It is not a substitute for a proper
            geology reference, but it can be useful at the kitchen table after a
            field trip.
          </p>
          <ul className={styles.list}>
            {identificationTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>
    </PublicShell>
  );
}
