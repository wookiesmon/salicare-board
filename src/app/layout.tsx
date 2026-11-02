import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { TaskPanelProvider } from "@/components/task-panel";
import { StoreProvider } from "@/lib/store";
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
        <StoreProvider>
          <TaskPanelProvider>
            <div className="flex min-h-dvh">
              <Sidebar />
              <main className="min-w-0 flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-10">
                <div className="mx-auto grid max-w-6xl gap-6">{children}</div>
              </main>
            </div>
          </TaskPanelProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
