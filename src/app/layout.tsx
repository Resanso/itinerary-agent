import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import Navbar from "@/components/layout/Navbar";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Itinerary Agent - Sustainable Travel Planner",
  description: "Platform perencanaan perjalanan cerdas yang berfokus pada pariwisata berkelanjutan (sustainable travel).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${inter.variable} antialiased`}
      >
        <TRPCProvider>
          <Navbar />
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
