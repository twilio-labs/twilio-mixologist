import OrdersInterface from "./ordersInterface";

export default function OrdersPage({ params }: { params: { slug: string } }) {
  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-8">
      <OrdersInterface slug={params.slug} />
    </main>
  );
}
