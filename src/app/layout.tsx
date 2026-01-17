import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Bellhopping - Book Luxury Hotels with 30% Commission",
  description: "Bellhopping is a sales platform for Travel Agents. Access exclusive perks, room upgrades, and earn up to 30% cash back on every booking. Free membership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <Header />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
