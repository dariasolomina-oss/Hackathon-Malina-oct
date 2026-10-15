import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Malina Oracle — Tarot for work, under the stars",
  description: "Choose an Arcana deck, draw two cards, and see what the sky adds to your reading.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
