import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Malina Oracle — A little perspective for the working week",
  description: "Bring a work question. Draw two cards. Leave with a fresh perspective.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
