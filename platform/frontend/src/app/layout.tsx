import type { Metadata } from "next";
import { Providers } from "@/providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | CyberCom",
    default: "CyberCom Enterprise Portal",
  },
  description: "Sovereign clinical EHR and enterprise management platform.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Real lang/dir/theme attributes are set client-side by PreferencesProvider
  // once it knows which account (if any) is signed in. These are just the
  // pre-hydration defaults; suppressHydrationWarning covers the one-frame
  // mismatch while that context reads localStorage.
  return (
    <html lang="en" dir="ltr" data-theme="dark" suppressHydrationWarning>
      <body className="cybercom-app-body bg-surface text-[var(--color-text)] antialiased">
        <Providers>
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
