import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

// Font imports Anda
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eco-Peta App", // Mengubah title default
  description: "Aplikasi pengumpulan dan pengelolaan sampah terpadu.", // Mengubah description default
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // PERBAIKAN: Menambahkan suppressHydrationWarning={true} pada tag <html>
    // Ini menginstruksikan React untuk mengabaikan ketidakcocokan atribut 
    // seperti 'foxified' yang disuntikkan oleh ekstensi browser.
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster 
          position="top-center"
          reverseOrder={false}
        />
        {children}
      </body>
    </html>
  );
}
