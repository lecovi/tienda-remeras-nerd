import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { BotonWhatsApp } from "@/components/BotonWhatsApp";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

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
  title: {
    default: "Nerd Wear | Remeras de cultura pop y videojuegos",
    template: "%s | Nerd Wear",
  },
  description:
    "Remeras nerd de videojuegos, cómics, animé y retro. Estampas duraderas, envíos a todo el país y 6 cuotas sin interés.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BotonWhatsApp />
      </body>
    </html>
  );
}
