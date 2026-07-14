import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "JobChecker — Job stack intelligence",
  description: "Extract, scrape, and classify technical job listings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Sidebar />
          <main className="min-h-screen md:ml-64">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
