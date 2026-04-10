import Image from "next/image";
import { PublicShell } from "@/components/public/public-shell";
import { recentFinds } from "@/components/public/content";
import styles from "@/components/public/public-site.module.css";

export default function GalleryPage() {
  return (
    <PublicShell activePath="/gallery">
      <section className={styles.section}>
        <h2 className={styles.sectionHeader}>Gallery</h2>
        <div className={styles.sectionBody}>
          <p>
            A few recent club table photos and traded specimens. We may add more
            when somebody remembers where the camera cable went.
          </p>
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
    </PublicShell>
  );
}
