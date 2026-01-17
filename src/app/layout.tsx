import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "JobComparator - Porovnávač pracovních pozic",
  description: "Porovnejte pracovní pozice a mzdy od různých firem na jednom místě",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50`}>
        <Navbar />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
