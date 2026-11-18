import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ray Brook Doodle",
  description: "Personal media streaming tracker & watchlist",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white m-0">
        {children}
      </body>
    </html>
  );
}