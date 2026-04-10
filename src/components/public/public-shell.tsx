import Link from "next/link";
import styles from "./public-site.module.css";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Field Trips", href: "/field-trips" },
  { label: "Identification Guide", href: "/identification-guide" },
  { label: "Gallery", href: "/gallery" },
  { label: "Resources", href: "/resources" },
];

export function PublicShell({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.topBar}>
          <h1 className={styles.title}>Vermont Amateur Rock &amp; Fossil Collectors</h1>
          <p className={styles.tagline}>
            A small local club for mineral, fossil, and old quarry enthusiasts around Vermont.
          </p>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              aria-current={activePath === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/login" className={styles.loginLink}>
            Member Login
          </Link>
        </nav>
        <main className={styles.content}>{children}</main>
        <footer className={styles.footer}>
          <p>Maintained by volunteers.</p>
          <p>Last updated: March 22, 2026</p>
          <p>Contact: clubdesk@vrocks.org</p>
        </footer>
      </div>
    </div>
  );
}
