import { PublicShell } from "@/components/public/public-shell";
import styles from "@/components/public/public-site.module.css";

export default function AboutPage() {
  return (
    <PublicShell activePath="/about">
      <section className={styles.section}>
        <h2 className={styles.sectionHeader}>About Us</h2>
        <div className={styles.sectionBody}>
          <p>
            The Vermont Amateur Rock &amp; Fossil Collectors is an informal club
            made up of hobbyists, retirees, students, and anybody else who still
            stops at roadcuts for a better look.
          </p>
          <p>
            We meet once a month, usually share finds on a folding table, and try
            to organize a handful of field trips each season when the weather is
            cooperative.
          </p>
          <p>
            Club dues are modest and mostly pay for room use, coffee supplies, and
            photocopies that keep vanishing from the supply cabinet.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
