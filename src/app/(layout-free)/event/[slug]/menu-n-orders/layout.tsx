import SyncProvider from "@/provider/syncProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <SyncProvider>{children}</SyncProvider>
    </div>
  );
}
