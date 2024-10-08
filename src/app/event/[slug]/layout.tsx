import SyncProvider from "@/provider/syncProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SyncProvider>{children}</SyncProvider>;
}
