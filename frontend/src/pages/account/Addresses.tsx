export default function Addresses() {
  return (
    <section className="flex min-h-64 flex-col items-center justify-center border border-dashed border-[#d8d5cc] bg-white text-center">
      <p className="font-display text-xl font-bold uppercase">
        No saved addresses
      </p>
      <p className="mt-2 max-w-sm text-sm text-[#77766e]">
        Delivery addresses you save during checkout will appear here for
        one-tap ordering.
      </p>
    </section>
  );
}
