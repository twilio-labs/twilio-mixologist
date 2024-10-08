export default function LoadingSpinner() {
  return (
    <div className="flex-1 flex flex-col h-auto justify-center">
      <h2 className="text-2xl font-semibold mb-6 text-center">Loading...</h2>
      <div className="animate-spin mx-auto my-16 rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );
}
