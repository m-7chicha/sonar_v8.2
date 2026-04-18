import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeContext";

const fontJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SONAR v8.2 Industrial OS",
  description: "Premium Industrial Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontJakarta.variable} ${fontMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="h-screen w-screen flex font-sans overflow-hidden zen-bg text-slate-900 transition-colors duration-500">
        <ThemeProvider>
          {/* Global Transparent Sidebar with Glassmorphism */}
          <Sidebar />
          
          {/* Zen Browser Style Floating Main Canvas */}
          <div className="flex-1 h-[calc(100vh-32px)] my-4 mr-4 bg-white/95 dark:bg-[#070b14]/90 backdrop-blur-md rounded-[2rem] shadow-[-30px_0_50px_rgba(15,23,42,0.15)] dark:shadow-[-30px_0_50px_rgba(0,0,0,0.6)] overflow-y-auto custom-scrollbar border border-white/60 dark:border-white/5 z-20 relative isolate transform-gpu transition-all duration-500">
            <div className="max-w-[1440px] mx-auto relative h-full">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
