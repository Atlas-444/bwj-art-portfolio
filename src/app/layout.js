import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "BWJ - ART",
  description: "Original works exploring form, material, and quiet tension.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.variable} font-sans min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}