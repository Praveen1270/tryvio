import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tryvio — AI IDE for Embedded Hardware",
  description:
    "Describe your hardware project in plain English. Get working firmware, a wiring diagram, and assembly instructions — instantly.",
  keywords: ["embedded", "firmware", "ESP32", "Arduino", "AI", "hardware", "IDE", "wiring diagram"],
  authors: [{ name: "Tryvio" }],
  openGraph: {
    title: "Tryvio — AI IDE for Embedded Hardware",
    description: "Generate firmware, wiring diagrams, and assembly instructions with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-white text-[#111111] overflow-hidden">
        {children}
      </body>
    </html>
  );
}
