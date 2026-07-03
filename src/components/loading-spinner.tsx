export default function LoadingSpinner() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-warm-strong border-t-twilio-ink" />
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  );
}
