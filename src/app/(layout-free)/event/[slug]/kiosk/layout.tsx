import Header from "../menu/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header number="ABC" />
      <main className="mx-60 my-24">{children}</main>
    </div>
  );
}
