import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "TCF Command Centre",
  description: "Private operating system for TCF.",
  applicationName: "TCF Command Centre",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
