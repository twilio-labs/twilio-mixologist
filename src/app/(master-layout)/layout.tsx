import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Privilege } from "@/middleware";
import { Toaster } from "@/components/ui/toaster";

import { SettingsIcon } from "lucide-react";
import { Inter } from "next/font/google";
import SessionButton from "@/components/session-button";

export const metadata: Metadata = {
  title: "Twilio Mixologist",
  description: "Get a free beverage from the Twilio Mixologist",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookiesStore = cookies();
  const isAdmin =
    (cookiesStore.get("privilege")?.value as Privilege) === Privilege.ADMIN;
  return (
    <>
      <Toaster />
      <div className="bg-gray-100 min-h-screen flex flex-col">
        <header className="bg-twilio-red py-4">
          <div className="mx-4 flex space-between items-center">
            <Link className="flex-1" href="/">
              <h1 className="text-white text-3xl font-bold">
                Twilio Mixologist
              </h1>
            </Link>
            <nav className="">
              <ul className="space-x flex ">
                {isAdmin && (
                  <Link
                    className="hover:bg-red-600 p-1 rounded-md text-white text-lg flex"
                    href="/configuration"
                  >
                    <SettingsIcon className="mr-2 text-white text-lg " />
                    <span className="hidden md:block">Configuration</span>
                  </Link>
                )}

                <SessionButton className="hover:bg-red-600 p-1 rounded-md" />
              </ul>
            </nav>
          </div>
        </header>
        <main className="container mx-auto p-4 flex-1 flex flex-col">
          {children}
        </main>
        <footer className="bg-twilio-red p-4 text-center text-white">
          <p>Made with ❤️ by Twilio</p>
        </footer>
      </div>
    </>
  );
}
