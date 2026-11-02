import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppGate } from "@/components/app-gate";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jb", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Salicare Launch Board",
  description: "Project management for the Salicare toothpaste launch",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>
        <AppGate>{children}</AppGate>
      </body>
    </html>
  );
}
