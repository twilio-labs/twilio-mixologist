import { notFound } from "next/navigation";
import OrdersInterface from "../ordersInterface";

export default async function TerminalPage(
  props: {
    params: Promise<{ slug: string; terminal: string }>;
  }
) {
  const params = await props.params;
  const { slug, terminal } = params;

  const terminalRegex = /^(\d+)-(\d+)$/;
  const matchedGroups = terminal.match(terminalRegex);
  const terminalId = Number(matchedGroups?.[1]),
    terminalCount = Number(matchedGroups?.[2]);

  if (
    !terminalRegex.test(terminal) ||
    terminalId > terminalCount ||
    terminalId === 0 ||
    isNaN(terminalId) ||
    isNaN(terminalCount)
  ) {
    return notFound();
  }

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-8">
      <OrdersInterface
        slug={slug}
        terminalId={terminalId}
        terminalCount={terminalCount}
      />
    </main>
  );
}
