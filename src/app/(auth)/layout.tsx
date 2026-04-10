import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Specimen Log Access",
  description: "Member login for the Vermont Amateur Rock & Fossil Collectors.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
