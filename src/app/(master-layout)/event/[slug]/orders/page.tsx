import OrdersInterface from "./ordersInterface";

export default async function OrdersPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-8">
      <OrdersInterface slug={params.slug} />
    </main>
  );
}
