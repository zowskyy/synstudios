import type { Metadata } from "next";
import { CapacitorInit } from "@/components/CapacitorInit";
import "./globals.css";

export const metadata: Metadata = {
  title: "SynStudios — Animation Trial Studio",
  description:
    "Preview 2D sprite sheets and 3D animation rigs in 30-second trial runs before full production commit.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <CapacitorInit />
        {children}
      </body>
    </html>
  );
}
