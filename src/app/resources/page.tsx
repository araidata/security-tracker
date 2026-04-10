import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import styles from "@/components/public/public-site.module.css";

export default function ResourcesPage() {
  return (
    <PublicShell activePath="/resources">
      <section className={styles.section}>
        <h2 className={styles.sectionHeader}>Resources</h2>
        <div className={`${styles.sectionBody} ${styles.resourceLinks}`}>
          <ul className={styles.list}>
            <li>
              <Link href="#">Printable field trip checklist (PDF placeholder)</Link>
            </li>
            <li>
              <Link href="#">Starter mineral ID notes (PDF placeholder)</Link>
            </li>
            <li>
              <Link href="#">Simple fossil cleaning sheet (PDF placeholder)</Link>
            </li>
          </ul>
          <p>
            Some member materials are only available through the member portal.
            Please contact the club administrator if you need access.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
