import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kungahara",
    template: "%s · Kungahara",
  },
  description: "A dependable digital marketplace for Rwanda's agricultural community.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "256x256" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head><link rel="preload" href="/images/kungahara-logo-optimized.png" as="image" type="image/png" /></head>
      <body>{children}</body>
    </html>
  );
}
