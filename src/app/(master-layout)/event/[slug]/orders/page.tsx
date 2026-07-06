import OrdersInterface from "./ordersInterface";

export default async function OrdersPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  return (
    <main className="w-full">
      <OrdersInterface slug={params.slug} />
    </main>
  );
}
