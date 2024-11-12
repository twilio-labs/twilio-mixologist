import Header from "../menu/header";

import { Toaster } from "@/components/ui/toaster";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header number="ABC" />
      <Toaster />
      <main className="px-24 pt-16">{children}</main> 
      {/* Use these parameters to adapt to a different screen size */}
    </div>
  );
}
