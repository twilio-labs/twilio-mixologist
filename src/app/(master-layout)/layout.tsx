import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Privilege } from "@/proxy";
import { Toaster } from "@/components/ui/toaster";

import { SettingsIcon } from "lucide-react";
import { Inter } from "next/font/google";
import SessionButton from "@/components/session-button";

export const metadata: Metadata = {
  title: "Twilio Mixologist",
  description: "Get a free beverage from the Twilio Mixologist",
};

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookiesStore = await cookies();
  const isAdmin =
    (cookiesStore.get("privilege")?.value as Privilege) === Privilege.ADMIN;
  return (
    <>
      <Toaster />
      <div className="bg-warm min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-twilio-ink focus:rounded-md focus:shadow-lg"
        >
          Skip to content
        </a>
        <header className="bg-twilio-ink border-b border-[#1e2d42]">
          <div className="mx-4 md:mx-8 py-3 flex items-center gap-4">
            <Link className="flex-1 min-w-0" href="/">
              <div className="flex items-center gap-2.5">
                <div aria-hidden="true" className="w-6 h-6 rounded bg-twilio-red flex-shrink-0" />
                <h1 className="text-white text-lg font-semibold tracking-tight truncate">
                  Twilio Mixologist
                </h1>
              </div>
            </Link>
            <nav>
              <ul className="flex items-center gap-1">
                {isAdmin && (
                  <Link
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[#9cafc8] hover:text-white hover:bg-[#1e2d42] transition-colors text-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-twilio-ink focus-visible:outline-none rounded-md"
                    href="/configuration"
                  >
                    <SettingsIcon aria-hidden="true" className="h-4 w-4" />
                    <span className="hidden md:block">Configuration</span>
                  </Link>
                )}
                <SessionButton className="flex items-center" />
              </ul>
            </nav>
          </div>
        </header>
        <main id="main-content" className="container mx-auto px-4 md:px-8 py-6 flex-1 flex flex-col">
          {children}
        </main>
        <footer className="border-t border-warm-strong py-4 text-center text-sm text-gray-400">
          Made with ❤️ by Twilio
        </footer>
      </div>
    </>
  );
}
