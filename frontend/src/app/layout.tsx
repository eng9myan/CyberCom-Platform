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
  const locale = "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} data-theme="dark" suppressHydrationWarning>
      <body className="cybercom-app-body bg-surface text-white antialiased">
        <Providers>
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
