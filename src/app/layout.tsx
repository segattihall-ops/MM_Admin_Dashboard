import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import MainLayout from "@/components/layout/main-layout";
import { getAdminContext } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "MasseurMatch Admin",
  description: "Admin dashboard for managing your application.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adminContext = await getAdminContext();
  const adminEmail = 'user' in adminContext && adminContext.user ? adminContext.user.email ?? undefined : undefined;

  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <MainLayout adminEmail={adminEmail}>{children}</MainLayout>
        <Toaster />
      </body>
    </html>
  );
}
