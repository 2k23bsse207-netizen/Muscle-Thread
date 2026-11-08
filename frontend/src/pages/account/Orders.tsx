import { Link } from "react-router-dom";
import { useOrders } from "../../hooks/useQueries";
import type { OrderListItem } from "../../lib/api";

function OrderRow({ order }: { order: OrderListItem }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-[#171914]/10 py-4 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">#{order.id.slice(-8)}</p>
        <p className="text-[10px] uppercase tracking-widest text-[#171914]/50">
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#171914]/60">
        {order.status}
      </span>
      <span className="text-sm font-black">${order.total.toFixed(2)}</span>
    </li>
  );
}

export default function Orders() {
  const { data, isLoading, isError, error, refetch } = useOrders();

  if (isLoading) {
    return (
      <section
        aria-label="Loading orders"
        className="min-h-64 border border-[#171914]/10 bg-white p-6"
      >
        <div className="animate-pulse space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 bg-[#EFEBE2]" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center border border-dashed border-[#d8d5cc] bg-white text-center">
        <p className="font-display text-xl font-bold uppercase">
          Could not load orders
        </p>
        <p className="mt-2 max-w-sm text-sm text-[#77766e]">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
        <button
          onClick={() => void refetch()}
          className="mt-5 bg-[#242421] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!data?.length) {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center border border-dashed border-[#d8d5cc] bg-white text-center">
        <p className="font-display text-xl font-bold uppercase">No orders yet</p>
        <p className="mt-2 text-sm text-[#77766e]">
          When you place an order, it will show up here with live tracking.
        </p>
        <Link
          to="/shop"
          className="mt-5 bg-[#242421] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white"
        >
          Start shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="border border-[#171914]/10 bg-white p-6">
      <h2 className="font-display text-2xl font-black italic uppercase tracking-tight">
        Order history
      </h2>
      <ul className="mt-4">
        {data.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </ul>
    </section>
  );
}
