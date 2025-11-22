import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const rajdhani = Rajdhani({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"], 
  variable: '--font-rajdhani' 
});

export const metadata: Metadata = {
  title: "FpsTrainer.ai | Master Your Gameplay",
  description: "AI-Powered FPS Coaching. Analyze Aim, Positioning, and Game Sense.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable} scroll-smooth`}>
      <body className="font-sans bg-background text-white selection:bg-neon selection:text-black">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
